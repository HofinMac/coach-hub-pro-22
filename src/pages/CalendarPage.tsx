import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Check, X, Clock, ChevronLeft, ChevronRight, List, LayoutGrid, Calendar as CalIcon, CalendarPlus, Share2 } from "lucide-react";
import { getBookingsByCoach, clients, type BookingStatus, type Booking } from "@/lib/demo-data";
import {
  format, parseISO, startOfDay, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth,
  differenceInMinutes,
} from "date-fns";
import { cs } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CreateSlotDialog from "@/components/CreateSlotDialog";
import ShareSlotsDialog from "@/components/ShareSlotsDialog";

const COACH_ID = "c1";

type ViewMode = "day" | "week" | "month";
type DisplayMode = "graphic" | "text";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  booked: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  no_show: "bg-destructive/10 text-destructive border-destructive/30",
};

const statusBlockColors: Record<BookingStatus, string> = {
  pending: "bg-warning/20 border-l-warning text-warning-foreground",
  booked: "bg-primary/15 border-l-primary text-foreground",
  completed: "bg-success/15 border-l-success text-foreground",
  cancelled: "bg-muted/50 border-l-muted-foreground text-muted-foreground",
  no_show: "bg-destructive/10 border-l-destructive text-destructive",
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "Čeká",
  booked: "Rezervováno",
  completed: "Dokončeno",
  cancelled: "Zrušeno",
  no_show: "Neúčast",
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 – 21:00

function BookingActions({ booking }: { booking: Booking }) {
  if (booking.status !== "pending") return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        className="text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        onClick={(e) => { e.stopPropagation(); toast.success(`Zamítnuto: ${booking.clientName}`); }}
      >
        <X className="h-3 w-3 inline" />
      </button>
      <button
        className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        onClick={(e) => { e.stopPropagation(); toast.success(`Schváleno: ${booking.clientName}`); }}
      >
        <Check className="h-3 w-3 inline" />
      </button>
    </div>
  );
}

// ── Text list view for a set of bookings ──
function TextBookingList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) return <p className="p-6 text-center text-sm text-muted-foreground">Žádné lekce.</p>;
  return (
    <div className="divide-y divide-border">
      {bookings.map(b => (
        <div key={b.id} className="flex items-center justify-between p-4 hover:bg-subtle transition-colors">
          <div className="flex items-center gap-4">
            <div className="text-right min-w-[60px]">
              <p className="text-sm font-mono tabular-nums font-medium text-foreground">{format(parseISO(b.startTime), "HH:mm")}</p>
              <p className="text-xs font-mono tabular-nums text-muted-foreground">{format(parseISO(b.endTime), "HH:mm")}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex items-center gap-3">
              <AvatarCircle initials={b.clientName.split(" ").map(n => n[0]).join("")} size="sm" />
              <div>
                <p className="text-sm font-medium text-foreground">{b.clientName}</p>
                <p className="text-xs text-muted-foreground">{b.type === "1:1" ? "Individuální" : "Skupinová"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {b.status === "pending" ? (
              <>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => toast.success(`Zamítnuto: ${b.clientName}`)}>
                  <X className="h-3 w-3" /> Zamítnout
                </Button>
                <Button size="sm" className="h-7 gap-1" onClick={() => toast.success(`Schváleno: ${b.clientName}`)}>
                  <Check className="h-3 w-3" /> Schválit
                </Button>
              </>
            ) : (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${statusStyles[b.status]}`}>{statusLabels[b.status]}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Graphic day view (Outlook-style time grid) ──
function GraphicDayView({ date, bookings }: { date: Date; bookings: Booking[] }) {
  return (
    <div className="relative">
      {HOURS.map(hour => (
        <div key={hour} className="flex border-b border-border/50 min-h-[60px]">
          <div className="w-14 shrink-0 py-1 pr-2 text-right">
            <span className="text-xs font-mono tabular-nums text-muted-foreground">{`${hour}:00`}</span>
          </div>
          <div className="flex-1 relative">
            {bookings
              .filter(b => {
                const start = parseISO(b.startTime);
                return start.getHours() === hour && isSameDay(start, date);
              })
              .map(b => {
                const start = parseISO(b.startTime);
                const end = parseISO(b.endTime);
                const duration = differenceInMinutes(end, start);
                const topOffset = start.getMinutes();
                const height = Math.max(duration, 30);
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "absolute left-1 right-2 rounded-md border-l-[3px] px-2 py-1 text-xs overflow-hidden transition-shadow hover:shadow-md cursor-pointer",
                      statusBlockColors[b.status]
                    )}
                    style={{ top: `${topOffset}px`, height: `${height}px` }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate">{b.clientName}</span>
                      <span className="text-[10px] opacity-70 shrink-0">
                        {format(start, "H:mm")}–{format(end, "H:mm")}
                      </span>
                    </div>
                    {height >= 40 && (
                      <span className="text-[10px] opacity-60">{b.type === "1:1" ? "Individuální" : "Skupinová"}</span>
                    )}
                    <BookingActions booking={b} />
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Graphic week view ──
function GraphicWeekView({ weekStart, allBookings }: { weekStart: Date; allBookings: Booking[] }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="flex border-b border-border sticky top-0 bg-card z-10">
          <div className="w-14 shrink-0" />
          {days.map(d => (
            <div key={d.toISOString()} className="flex-1 text-center py-2 border-l border-border/50">
              <span className="text-xs text-muted-foreground">{format(d, "EEE", { locale: cs })}</span>
              <span className="block text-sm font-semibold text-foreground tabular-nums">{format(d, "d")}</span>
            </div>
          ))}
        </div>
        {/* Time grid */}
        {HOURS.map(hour => (
          <div key={hour} className="flex border-b border-border/30 min-h-[48px]">
            <div className="w-14 shrink-0 py-0.5 pr-2 text-right">
              <span className="text-[10px] font-mono tabular-nums text-muted-foreground">{`${hour}:00`}</span>
            </div>
            {days.map(d => {
              const hourBookings = allBookings.filter(b => {
                const start = parseISO(b.startTime);
                return start.getHours() === hour && isSameDay(start, d);
              });
              return (
                <div key={d.toISOString()} className="flex-1 border-l border-border/30 relative px-0.5">
                  {hourBookings.map(b => {
                    const start = parseISO(b.startTime);
                    const end = parseISO(b.endTime);
                    const duration = differenceInMinutes(end, start);
                    const topOff = start.getMinutes() * (48 / 60);
                    const h = Math.max((duration / 60) * 48, 20);
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          "absolute left-0.5 right-0.5 rounded border-l-2 px-1 py-0.5 text-[10px] leading-tight overflow-hidden cursor-pointer hover:shadow-sm",
                          statusBlockColors[b.status]
                        )}
                        style={{ top: `${topOff}px`, height: `${h}px` }}
                        title={`${b.clientName} ${format(start, "H:mm")}–${format(end, "H:mm")}`}
                      >
                        <span className="font-semibold truncate block">{b.clientName.split(" ")[0]}</span>
                        {h >= 30 && <span className="opacity-60">{format(start, "H:mm")}</span>}
                      </div>
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
}

// ── Month view ──
function MonthView({ month, allBookings, onSelectDay }: { month: Date; allBookings: Booking[]; onSelectDay: (d: Date) => void }) {
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
          const dayBks = allBookings.filter(b => isSameDay(parseISO(b.startTime), day));
          const isCurrentMonth = isSameMonth(day, month);
          const hasPending = dayBks.some(b => b.status === "pending");
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-[80px] border-b border-r border-border/50 p-1.5 text-left transition-colors hover:bg-subtle",
                !isCurrentMonth && "opacity-40"
              )}
            >
              <span className={cn(
                "text-xs font-medium tabular-nums",
                isSameDay(day, new Date(2026, 2, 18)) ? "bg-primary text-primary-foreground rounded-full px-1.5 py-0.5" : "text-foreground"
              )}>
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayBks.slice(0, 3).map(b => (
                  <div
                    key={b.id}
                    className={cn(
                      "text-[10px] leading-tight px-1 py-0.5 rounded truncate border-l-2",
                      statusBlockColors[b.status]
                    )}
                  >
                    {format(parseISO(b.startTime), "H:mm")} {b.clientName.split(" ")[0]}
                  </div>
                ))}
                {dayBks.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{dayBks.length - 3} dalších</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Calendar Page ──
export default function CalendarPage() {
  const allBookings = getBookingsByCoach(COACH_ID);
  const today = new Date(2026, 2, 18);
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("graphic");

  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [newLessonOpen, setNewLessonOpen] = useState(false);
  const [nlClient, setNlClient] = useState("");
  const [nlDate, setNlDate] = useState("");
  const [nlTime, setNlTime] = useState("09:00");
  const [nlDuration, setNlDuration] = useState("60");
  const [nlType, setNlType] = useState<"1:1" | "group">("1:1");

  const pendingCount = allBookings.filter(b => b.status === "pending").length;

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

  // Filtered bookings for current view
  const getVisibleBookings = () => {
    if (viewMode === "day") {
      return allBookings.filter(b => isSameDay(parseISO(b.startTime), currentDate))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return allBookings.filter(b => {
        const d = parseISO(b.startTime);
        return d >= ws && d <= we;
      }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    return allBookings.filter(b => {
      const d = parseISO(b.startTime);
      return d >= ms && d <= me;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const visibleBookings = getVisibleBookings();

  return (
    <div className="p-6 max-w-[1200px] mx-auto animate-fade-in">
      <PageHeader title="Kalendář" description="Správa rozvrhu">
        <Button size="sm" className="gap-1.5" onClick={() => { setNlDate(format(currentDate, "yyyy-MM-dd")); setNewLessonOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> Rezervovat lekci
        </Button>
      </PageHeader>

      {/* Pending requests banner */}
      {pendingCount > 0 && (
        <div className="mb-4 rounded-xl bg-warning/10 border border-warning/20 p-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-warning shrink-0" />
          <p className="text-sm font-medium text-foreground">
            {pendingCount} {pendingCount === 1 ? "žádost" : pendingCount < 5 ? "žádosti" : "žádostí"} čeká na schválení
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
            Dnes
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold text-foreground ml-2 capitalize">{headerLabel()}</h2>
        </div>

        {/* View mode + display toggle */}
        <div className="flex items-center gap-1">
          {/* View mode */}
          <div className="flex bg-muted rounded-lg p-0.5">
            {(["day", "week", "month"] as ViewMode[]).map(vm => (
              <button
                key={vm}
                onClick={() => setViewMode(vm)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  viewMode === vm ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {vm === "day" ? "Den" : vm === "week" ? "Týden" : "Měsíc"}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Display mode */}
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setDisplayMode("graphic")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                displayMode === "graphic" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grafické zobrazení"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode("text")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                displayMode === "text" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              title="Textový seznam"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        {displayMode === "text" ? (
          <>
            {viewMode === "month" ? (
              // Month text: group by day
              <div>
                {(() => {
                  const days = new Map<string, Booking[]>();
                  visibleBookings.forEach(b => {
                    const key = format(parseISO(b.startTime), "yyyy-MM-dd");
                    if (!days.has(key)) days.set(key, []);
                    days.get(key)!.push(b);
                  });
                  if (days.size === 0) return <p className="p-8 text-center text-sm text-muted-foreground">Žádné lekce tento měsíc.</p>;
                  return Array.from(days.entries()).map(([key, bks]) => (
                    <div key={key}>
                      <div className="px-4 py-2 bg-subtle border-b border-border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                          {format(parseISO(key), "EEEE, d. MMMM", { locale: cs })}
                        </span>
                      </div>
                      <TextBookingList bookings={bks} />
                    </div>
                  ));
                })()}
              </div>
            ) : viewMode === "week" ? (
              <div>
                {(() => {
                  const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
                  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
                  return weekDays.map(d => {
                    const dayBks = visibleBookings.filter(b => isSameDay(parseISO(b.startTime), d));
                    if (dayBks.length === 0) return null;
                    return (
                      <div key={d.toISOString()}>
                        <div className="px-4 py-2 bg-subtle border-b border-border">
                          <span className="text-xs font-semibold text-muted-foreground uppercase">
                            {format(d, "EEEE, d. MMMM", { locale: cs })}
                          </span>
                        </div>
                        <TextBookingList bookings={dayBks} />
                      </div>
                    );
                  }).filter(Boolean);
                })()}
                {visibleBookings.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Žádné lekce tento týden.</p>}
              </div>
            ) : (
              <TextBookingList bookings={visibleBookings} />
            )}
          </>
        ) : (
          <>
            {viewMode === "day" && (
              <GraphicDayView date={currentDate} bookings={visibleBookings} />
            )}
            {viewMode === "week" && (
              <GraphicWeekView
                weekStart={startOfWeek(currentDate, { weekStartsOn: 1 })}
                allBookings={visibleBookings}
              />
            )}
            {viewMode === "month" && (
              <MonthView
                month={currentDate}
                allBookings={allBookings}
                onSelectDay={(d) => { setCurrentDate(d); setViewMode("day"); }}
              />
            )}
          </>
        )}
      </div>
      {/* New Lesson Dialog */}
      <Dialog open={newLessonOpen} onOpenChange={setNewLessonOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rezervovat lekci</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Klient</Label>
              <Select value={nlClient} onValueChange={setNlClient}>
                <SelectTrigger><SelectValue placeholder="Vyberte klienta" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Datum</Label>
                <Input type="date" value={nlDate} onChange={e => setNlDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Čas</Label>
                <Input type="time" value={nlTime} onChange={e => setNlTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Délka (min)</Label>
                <Select value={nlDuration} onValueChange={setNlDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Typ</Label>
                <Select value={nlType} onValueChange={v => setNlType(v as "1:1" | "group")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Individuální</SelectItem>
                    <SelectItem value="group">Skupinová</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLessonOpen(false)}>Zrušit</Button>
            <Button onClick={() => {
              if (!nlClient || !nlDate) { toast.error("Vyplňte klienta a datum"); return; }
              toast.success("Lekce zarezervována");
              setNewLessonOpen(false);
              setNlClient(""); setNlDate(""); setNlTime("09:00"); setNlDuration("60"); setNlType("1:1");
            }}>Rezervovat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
