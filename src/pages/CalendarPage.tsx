import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Clock, ChevronLeft, ChevronRight, List, LayoutGrid, CalendarPlus, Share2 } from "lucide-react";
import {
  format, parseISO, startOfDay, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth,
  differenceInMinutes,
} from "date-fns";
import { cs } from "date-fns/locale";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import CreateSlotDialog from "@/components/CreateSlotDialog";
import ShareSlotsDialog from "@/components/ShareSlotsDialog";
import SlotDetailDialog from "@/components/SlotDetailDialog";

type ViewMode = "day" | "week" | "month";
type DisplayMode = "graphic" | "text";

interface SlotRow {
  id: string;
  coach_id: string;
  start_time: string;
  end_time: string;
  slot_type: string;
  capacity: number;
  booked_count: number;
  status: string;
  notes: string | null;
}

interface BookingRow {
  id: string;
  slot_id: string;
  client_id: string;
  status: string;
}

interface SlotWithBookings extends SlotRow {
  bookings: Array<BookingRow & { client_name?: string }>;
}

const slotTypeLabels: Record<string, string> = {
  individual: "Individuální",
  online: "Online",
  group: "Skupinová",
};

const statusBlockColors: Record<string, string> = {
  available: "bg-primary/10 border-l-primary text-foreground",
  partially_booked: "bg-warning/15 border-l-warning text-foreground",
  booked: "bg-success/15 border-l-success text-foreground",
  cancelled: "bg-muted/50 border-l-muted-foreground text-muted-foreground",
  completed: "bg-success/10 border-l-success text-muted-foreground",
  no_show: "bg-destructive/10 border-l-destructive text-destructive",
};

const statusLabels: Record<string, string> = {
  available: "Volný",
  partially_booked: "Částečně",
  booked: "Obsazený",
  cancelled: "Zrušený",
  completed: "Dokončeno",
  no_show: "Neúčast",
};

const statusBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "outline",
  partially_booked: "secondary",
  booked: "default",
  cancelled: "destructive",
  completed: "default",
  no_show: "destructive",
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("graphic");
  const [createSlotOpen, setCreateSlotOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [slots, setSlots] = useState<SlotWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithBookings | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: slotsData, error } = await supabase
        .from("coach_slots")
        .select("*")
        .eq("coach_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw error;

      const slotIds = (slotsData || []).map((s: any) => s.id);
      let bookingsData: any[] = [];
      if (slotIds.length > 0) {
        const { data: bData } = await supabase
          .from("slot_bookings")
          .select("*")
          .in("slot_id", slotIds);
        bookingsData = bData || [];
      }

      // Fetch client names
      const clientIds = [...new Set(bookingsData.map((b: any) => b.client_id))];
      const profileMap: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", clientIds);
        profiles?.forEach((p: any) => { profileMap[p.id] = p.full_name; });
      }

      const enriched: SlotWithBookings[] = (slotsData || []).map((s: any) => ({
        ...s,
        bookings: bookingsData
          .filter((b: any) => b.slot_id === s.id)
          .map((b: any) => ({ ...b, client_name: profileMap[b.client_id] || "Klient" })),
      }));

      setSlots(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const pendingBookings = slots.flatMap(s => 
    s.bookings.filter(b => b.status === "pending").map(b => ({ ...b, slot: s }))
  );

  const navigate = (dir: -1 | 1) => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, dir));
    else if (viewMode === "week") setCurrentDate(d => addWeeks(d, dir));
    else setCurrentDate(d => addMonths(d, dir));
  };

  const goToday = () => setCurrentDate(today);

  const headerLabel = () => {
    if (viewMode === "day") return format(currentDate, "EEEE, d. MMMM yyyy", { locale: cs });
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, "d. MMM", { locale: cs })} – ${format(we, "d. MMM yyyy", { locale: cs })}`;
    }
    return format(currentDate, "LLLL yyyy", { locale: cs });
  };

  const getVisibleSlots = () => {
    if (viewMode === "day") {
      return slots.filter(s => isSameDay(new Date(s.start_time), currentDate));
    }
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return slots.filter(s => {
        const d = new Date(s.start_time);
        return d >= ws && d <= we;
      });
    }
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    return slots.filter(s => {
      const d = new Date(s.start_time);
      return d >= ms && d <= me;
    });
  };

  const visibleSlots = getVisibleSlots();

  const handleQuickApprove = async (bookingId: string, slotId: string) => {
    const { error } = await supabase.from("slot_bookings").update({ status: "confirmed" } as any).eq("id", bookingId);
    if (error) { toast.error("Chyba"); return; }
    toast.success("Rezervace schválena");
    fetchSlots();
  };

  const handleQuickReject = async (bookingId: string, slot: SlotWithBookings) => {
    const { error } = await supabase.from("slot_bookings").update({ status: "rejected" } as any).eq("id", bookingId);
    if (error) { toast.error("Chyba"); return; }
    await supabase.from("coach_slots").update({ 
      booked_count: Math.max(0, slot.booked_count - 1), 
      status: "available" 
    } as any).eq("id", slot.id);
    toast.success("Rezervace zamítnuta");
    fetchSlots();
  };

  // ── Text list view ──
  const TextSlotList = ({ items }: { items: SlotWithBookings[] }) => {
    if (items.length === 0) return <p className="p-8 text-center text-sm text-muted-foreground">Žádné termíny.</p>;
    return (
      <div className="divide-y divide-border">
        {items.map(s => {
          const start = new Date(s.start_time);
          const end = new Date(s.end_time);
          const hasPending = s.bookings.some(b => b.status === "pending");
          return (
            <button key={s.id} onClick={() => setSelectedSlot(s)}
              className="flex items-center justify-between p-4 hover:bg-subtle transition-colors w-full text-left">
              <div className="flex items-center gap-4">
                <div className="text-right min-w-[60px]">
                  <p className="text-sm font-mono tabular-nums font-medium text-foreground">{format(start, "HH:mm")}</p>
                  <p className="text-xs font-mono tabular-nums text-muted-foreground">{format(end, "HH:mm")}</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {slotTypeLabels[s.slot_type] || s.slot_type}
                    {s.bookings.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({s.bookings.filter(b => b.status === "confirmed" || b.status === "pending").map(b => b.client_name).join(", ")})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.booked_count}/{s.capacity} obsazeno
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasPending && <Badge variant="outline" className="text-warning border-warning/30 text-[10px]">Žádost</Badge>}
                <Badge variant={statusBadgeVariants[s.status] || "secondary"} className="text-[10px]">
                  {statusLabels[s.status] || s.status}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // ── Graphic day view ──
  const GraphicDayView = ({ date, items }: { date: Date; items: SlotWithBookings[] }) => (
    <div className="relative">
      {HOURS.map(hour => (
        <div key={hour} className="flex border-b border-border/50 min-h-[60px]">
          <div className="w-14 shrink-0 py-1 pr-2 text-right">
            <span className="text-xs font-mono tabular-nums text-muted-foreground">{`${hour}:00`}</span>
          </div>
          <div className="flex-1 relative">
            {items
              .filter(s => new Date(s.start_time).getHours() === hour && isSameDay(new Date(s.start_time), date))
              .map(s => {
                const start = new Date(s.start_time);
                const end = new Date(s.end_time);
                const duration = differenceInMinutes(end, start);
                const topOffset = start.getMinutes();
                const height = Math.max(duration, 30);
                const hasPending = s.bookings.some(b => b.status === "pending");
                return (
                  <button key={s.id} onClick={() => setSelectedSlot(s)}
                    className={cn(
                      "absolute left-1 right-2 rounded-md border-l-[3px] px-2 py-1 text-xs overflow-hidden transition-shadow hover:shadow-md cursor-pointer text-left",
                      statusBlockColors[s.status] || "bg-muted"
                    )}
                    style={{ top: `${topOffset}px`, height: `${height}px` }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate">
                        {s.bookings.length > 0 
                          ? s.bookings.filter(b => b.status !== "cancelled" && b.status !== "rejected").map(b => b.client_name).join(", ") || slotTypeLabels[s.slot_type]
                          : slotTypeLabels[s.slot_type]}
                      </span>
                      <span className="text-[10px] opacity-70 shrink-0">
                        {format(start, "H:mm")}–{format(end, "H:mm")}
                      </span>
                      {hasPending && <Clock className="h-3 w-3 text-warning shrink-0" />}
                    </div>
                    {height >= 40 && (
                      <span className="text-[10px] opacity-60">{statusLabels[s.status]}</span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Graphic week view ──
  const GraphicWeekView = ({ weekStart, items }: { weekStart: Date; items: SlotWithBookings[] }) => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="flex border-b border-border sticky top-0 bg-card z-10">
            <div className="w-14 shrink-0" />
            {days.map(d => (
              <div key={d.toISOString()} className="flex-1 text-center py-2 border-l border-border/50">
                <span className="text-xs text-muted-foreground">{format(d, "EEE", { locale: cs })}</span>
                <span className={cn("block text-sm font-semibold tabular-nums",
                  isSameDay(d, today) ? "text-primary" : "text-foreground"
                )}>{format(d, "d")}</span>
              </div>
            ))}
          </div>
          {HOURS.map(hour => (
            <div key={hour} className="flex border-b border-border/30 min-h-[48px]">
              <div className="w-14 shrink-0 py-0.5 pr-2 text-right">
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground">{`${hour}:00`}</span>
              </div>
              {days.map(d => {
                const hourSlots = items.filter(s => {
                  const start = new Date(s.start_time);
                  return start.getHours() === hour && isSameDay(start, d);
                });
                return (
                  <div key={d.toISOString()} className="flex-1 border-l border-border/30 relative px-0.5">
                    {hourSlots.map(s => {
                      const start = new Date(s.start_time);
                      const end = new Date(s.end_time);
                      const duration = differenceInMinutes(end, start);
                      const topOff = start.getMinutes() * (48 / 60);
                      const h = Math.max((duration / 60) * 48, 20);
                      const hasPending = s.bookings.some(b => b.status === "pending");
                      return (
                        <button key={s.id} onClick={() => setSelectedSlot(s)}
                          className={cn(
                            "absolute left-0.5 right-0.5 rounded border-l-2 px-1 py-0.5 text-[10px] leading-tight overflow-hidden cursor-pointer hover:shadow-sm text-left",
                            statusBlockColors[s.status] || "bg-muted"
                          )}
                          style={{ top: `${topOff}px`, height: `${h}px` }}
                          title={`${slotTypeLabels[s.slot_type]} ${format(start, "H:mm")}–${format(end, "H:mm")}`}
                        >
                          <span className="font-semibold truncate block">
                            {s.bookings.length > 0
                              ? s.bookings.filter(b => b.status !== "cancelled").map(b => (b.client_name || "").split(" ")[0]).join(", ") || slotTypeLabels[s.slot_type]
                              : slotTypeLabels[s.slot_type]}
                          </span>
                          {h >= 30 && <span className="opacity-60">{format(start, "H:mm")}</span>}
                          {hasPending && <Clock className="h-2.5 w-2.5 text-warning" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Month view ──
  const MonthView = ({ month, items }: { month: Date; items: SlotWithBookings[] }) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: calStart, end: calEnd });
    const dayNames = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

    return (
      <div>
        <div className="grid grid-cols-7 border-b border-border">
          {dayNames.map(d => (
            <div key={d} className="text-center py-2 text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {allDays.map(day => {
            const daySlots = items.filter(s => isSameDay(new Date(s.start_time), day));
            const isCurrentMonth = isSameMonth(day, month);
            return (
              <button key={day.toISOString()}
                onClick={() => { setCurrentDate(day); setViewMode("day"); }}
                className={cn(
                  "min-h-[80px] border-b border-r border-border/50 p-1.5 text-left transition-colors hover:bg-subtle",
                  !isCurrentMonth && "opacity-40"
                )}>
                <span className={cn("text-xs font-medium tabular-nums",
                  isSameDay(day, today) ? "bg-primary text-primary-foreground rounded-full px-1.5 py-0.5" : "text-foreground"
                )}>{format(day, "d")}</span>
                <div className="mt-1 space-y-0.5">
                  {daySlots.slice(0, 3).map(s => (
                    <div key={s.id}
                      className={cn("text-[10px] leading-tight px-1 py-0.5 rounded truncate border-l-2", statusBlockColors[s.status] || "bg-muted")}>
                      {format(new Date(s.start_time), "H:mm")} {
                        s.bookings.length > 0
                          ? s.bookings[0].client_name?.split(" ")[0]
                          : slotTypeLabels[s.slot_type]
                      }
                    </div>
                  ))}
                  {daySlots.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{daySlots.length - 3} dalších</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto animate-fade-in">
      <PageHeader title="Kalendář" description="Správa rozvrhu a volných termínů">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShareOpen(true)}>
            <Share2 className="h-3.5 w-3.5" /> Sdílet termíny
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateSlotOpen(true)}>
            <CalendarPlus className="h-3.5 w-3.5" /> Volný termín
          </Button>
        </div>
      </PageHeader>

      {/* Pending requests banner */}
      {pendingBookings.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="rounded-xl bg-warning/10 border border-warning/20 p-3">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-4 w-4 text-warning shrink-0" />
              <p className="text-sm font-medium text-foreground">
                {pendingBookings.length} {pendingBookings.length === 1 ? "žádost čeká" : pendingBookings.length < 5 ? "žádosti čekají" : "žádostí čeká"} na schválení
              </p>
            </div>
            <div className="space-y-1.5">
              {pendingBookings.map(pb => {
                const start = new Date(pb.slot.start_time);
                return (
                  <div key={pb.id} className="flex items-center justify-between bg-card rounded-lg p-2.5 border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div>
                        <p className="text-sm font-medium text-foreground truncate">
                          {pb.client_name || "Klient"} — {slotTypeLabels[pb.slot.slot_type]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(start, "EEEE d. MMMM, H:mm", { locale: cs })} – {format(new Date(pb.slot.end_time), "H:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-destructive"
                        onClick={() => handleQuickReject(pb.id, pb.slot)}>
                        <X className="h-3 w-3" /> Zamítnout
                      </Button>
                      <Button size="sm" className="h-7 gap-1"
                        onClick={() => handleQuickApprove(pb.id, pb.slot.id)}>
                        <Check className="h-3 w-3" /> Schválit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs">Dnes</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold text-foreground ml-2 capitalize">{headerLabel()}</h2>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex bg-muted rounded-lg p-0.5">
            {(["day", "week", "month"] as ViewMode[]).map(vm => (
              <button key={vm} onClick={() => setViewMode(vm)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  viewMode === vm ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {vm === "day" ? "Den" : vm === "week" ? "Týden" : "Měsíc"}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={() => setDisplayMode("graphic")}
              className={cn("p-1.5 rounded-md transition-colors",
                displayMode === "graphic" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )} title="Grafické zobrazení">
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setDisplayMode("text")}
              className={cn("p-1.5 rounded-md transition-colors",
                displayMode === "text" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )} title="Textový seznam">
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Načítám...</p>
        ) : displayMode === "text" ? (
          <>
            {viewMode === "month" ? (
              <div>
                {(() => {
                  const days = new Map<string, SlotWithBookings[]>();
                  visibleSlots.forEach(s => {
                    const key = format(new Date(s.start_time), "yyyy-MM-dd");
                    if (!days.has(key)) days.set(key, []);
                    days.get(key)!.push(s);
                  });
                  if (days.size === 0) return <p className="p-8 text-center text-sm text-muted-foreground">Žádné termíny tento měsíc.</p>;
                  return Array.from(days.entries()).map(([key, slts]) => (
                    <div key={key}>
                      <div className="px-4 py-2 bg-subtle border-b border-border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                          {format(parseISO(key), "EEEE, d. MMMM", { locale: cs })}
                        </span>
                      </div>
                      <TextSlotList items={slts} />
                    </div>
                  ));
                })()}
              </div>
            ) : viewMode === "week" ? (
              <div>
                {(() => {
                  const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
                  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
                  const rendered = weekDays.map(d => {
                    const daySlots = visibleSlots.filter(s => isSameDay(new Date(s.start_time), d));
                    if (daySlots.length === 0) return null;
                    return (
                      <div key={d.toISOString()}>
                        <div className="px-4 py-2 bg-subtle border-b border-border">
                          <span className="text-xs font-semibold text-muted-foreground uppercase">
                            {format(d, "EEEE, d. MMMM", { locale: cs })}
                          </span>
                        </div>
                        <TextSlotList items={daySlots} />
                      </div>
                    );
                  }).filter(Boolean);
                  return rendered.length > 0 ? rendered : <p className="p-8 text-center text-sm text-muted-foreground">Žádné termíny tento týden.</p>;
                })()}
              </div>
            ) : (
              <TextSlotList items={visibleSlots} />
            )}
          </>
        ) : (
          <>
            {viewMode === "day" && <GraphicDayView date={currentDate} items={visibleSlots} />}
            {viewMode === "week" && (
              <GraphicWeekView weekStart={startOfWeek(currentDate, { weekStartsOn: 1 })} items={visibleSlots} />
            )}
            {viewMode === "month" && <MonthView month={currentDate} items={slots} />}
          </>
        )}
      </div>

      <CreateSlotDialog
        open={createSlotOpen}
        onOpenChange={setCreateSlotOpen}
        defaultDate={format(currentDate, "yyyy-MM-dd")}
        onCreated={fetchSlots}
      />

      <ShareSlotsDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        slotCount={slots.filter(s => s.status === "available").length}
      />

      <SlotDetailDialog
        slot={selectedSlot}
        open={!!selectedSlot}
        onOpenChange={(v) => { if (!v) setSelectedSlot(null); }}
        onUpdated={fetchSlots}
      />
    </div>
  );
}
