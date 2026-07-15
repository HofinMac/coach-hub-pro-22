import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarPlus, Clock, Check, Users, Monitor, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface SlotRow {
  id: string;
  coach_id: string;
  start_time: string;
  end_time: string;
  slot_type: string;
  capacity: number;
  booked_count: number;
  status: string;
}

interface BookingRow {
  id: string;
  slot_id: string;
  status: string;
  created_at: string;
  slot: SlotRow | null;
}

const bookingStatusLabels: Record<string, string> = {
  pending: "Čeká na schválení",
  confirmed: "Potvrzeno",
  completed: "Dokončeno",
  cancelled: "Zrušeno",
  rejected: "Zamítnuto",
  no_show: "Neúčast",
};

const bookingStatusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
  no_show: "bg-destructive/10 text-destructive",
};

const slotTypeIcons: Record<string, React.ElementType> = {
  individual: Users,
  online: Monitor,
  group: Users,
};

const slotTypeLabels: Record<string, string> = {
  individual: "Individuální",
  online: "Online konzultace",
  group: "Skupinová lekce",
};

export default function ClientCalendarPage() {
  const [loading, setLoading] = useState(true);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [hasCoach, setHasCoach] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<SlotRow[]>([]);
  const [myBookings, setMyBookings] = useState<BookingRow[]>([]);
  const [confirmSlot, setConfirmSlot] = useState<SlotRow | null>(null);
  const [booking, setBooking] = useState(false);
  const [view, setView] = useState<"slots" | "bookings">("slots");

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles" as any)
        .select("assigned_coach_id")
        .eq("id", user.id)
        .single();

      const assignedCoachId = (profile as any)?.assigned_coach_id as string | null;
      setHasCoach(!!assignedCoachId);

      if (assignedCoachId) {
        const { data: coachProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", assignedCoachId)
          .single();
        setCoachName((coachProfile as any)?.full_name || null);

        const { data: slotsData } = await supabase
          .from("coach_slots")
          .select("*")
          .in("status", ["available", "partially_booked"])
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true });
        setAvailableSlots((slotsData as any) || []);
      } else {
        setAvailableSlots([]);
      }

      const { data: bookingsData } = await supabase
        .from("slot_bookings" as any)
        .select("id, slot_id, status, created_at")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      const bookingsList = (bookingsData as any[]) || [];
      const slotIds = [...new Set(bookingsList.map(b => b.slot_id))];
      let slotsById: Record<string, SlotRow> = {};
      if (slotIds.length > 0) {
        const { data: bookedSlots } = await supabase.from("coach_slots").select("*").in("id", slotIds);
        slotsById = Object.fromEntries(((bookedSlots as any[]) || []).map(s => [s.id, s]));
      }

      setMyBookings(bookingsList.map(b => ({ ...b, slot: slotsById[b.slot_id] || null })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBook = async () => {
    if (!confirmSlot) return;
    setBooking(true);
    const { error } = await supabase.rpc("book_coach_slot" as any, { _slot_id: confirmSlot.id } as any);
    setBooking(false);
    setConfirmSlot(null);

    if (error) {
      if (error.message?.includes("SLOT_FULL")) toast.error("Termín je již plně obsazen.");
      else if (error.message?.includes("SLOT_NOT_BOOKABLE") || error.message?.includes("SLOT_NOT_FOUND")) toast.error("Tento termín již není k dispozici.");
      else if ((error as any).code === "23505") toast.error("Tento termín už máte zarezervovaný.");
      else toast.error("Chyba: " + error.message);
      fetchData();
      return;
    }

    toast.success("Termín zarezervován! Čeká na potvrzení trenéra.");
    fetchData();
  };

  const handleCancelBooking = async (bookingId: string) => {
    const { error } = await supabase.rpc("cancel_client_booking" as any, { _booking_id: bookingId } as any);
    if (error) { toast.error("Chyba: " + error.message); return; }
    toast.success("Rezervace zrušena");
    fetchData();
  };

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const date = format(parseISO(slot.start_time), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, SlotRow[]>);

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="Kalendář"
        description={coachName ? `Dostupné termíny u trenéra ${coachName} a tvoje rezervace` : "Dostupné termíny a tvoje rezervace"}
      />

      {/* Tab toggle */}
      <div className="flex bg-muted rounded-lg p-0.5 mb-6 w-fit">
        <button
          onClick={() => setView("slots")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            view === "slots" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <CalendarPlus className="h-4 w-4 inline mr-1.5" />
          Volné termíny
        </button>
        <button
          onClick={() => setView("bookings")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            view === "bookings" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Clock className="h-4 w-4 inline mr-1.5" />
          Moje rezervace
        </button>
      </div>

      {loading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Načítám...</p>
      ) : view === "slots" ? (
        <div className="space-y-4">
          {!hasCoach ? (
            <div className="rounded-xl bg-card shadow-card p-8 text-center">
              <CalendarPlus className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Zatím nemáte přiřazeného trenéra.</p>
            </div>
          ) : Object.keys(slotsByDate).length === 0 ? (
            <div className="rounded-xl bg-card shadow-card p-8 text-center">
              <CalendarPlus className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Momentálně nejsou k dispozici žádné volné termíny.</p>
            </div>
          ) : (
            Object.entries(slotsByDate).map(([date, slots]) => (
              <div key={date}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {format(parseISO(date), "EEEE, d. MMMM yyyy", { locale: cs })}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map(slot => {
                    const Icon = slotTypeIcons[slot.slot_type] || Users;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setConfirmSlot(slot)}
                        className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {format(parseISO(slot.start_time), "H:mm")} – {format(parseISO(slot.end_time), "H:mm")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {slotTypeLabels[slot.slot_type]}
                              {slot.capacity > 1 && ` · ${slot.booked_count}/${slot.capacity} obsazeno`}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1 shrink-0">
                          <CalendarPlus className="h-3.5 w-3.5" /> Rezervovat
                        </Button>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-card shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {myBookings.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Žádné rezervace.</p>
            ) : (
              myBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-4 hover:bg-subtle transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {b.slot ? format(parseISO(b.slot.start_time), "EEEE, d. MMMM yyyy", { locale: cs }) : "Termín smazán"}
                    </p>
                    {b.slot && (
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(b.slot.start_time), "H:mm")} – {format(parseISO(b.slot.end_time), "H:mm")} · {slotTypeLabels[b.slot.slot_type]}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bookingStatusColors[b.status]}`}>
                      {bookingStatusLabels[b.status] || b.status}
                    </span>
                    {(b.status === "pending" || b.status === "confirmed") && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-destructive" onClick={() => handleCancelBooking(b.id)}>
                        <X className="h-3 w-3" /> Zrušit
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Confirm booking dialog */}
      <Dialog open={!!confirmSlot} onOpenChange={() => setConfirmSlot(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Potvrdit rezervaci</DialogTitle>
          </DialogHeader>
          {confirmSlot && (
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <CalendarPlus className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {format(parseISO(confirmSlot.start_time), "EEEE, d. MMMM", { locale: cs })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(confirmSlot.start_time), "H:mm")} – {format(parseISO(confirmSlot.end_time), "H:mm")} · {slotTypeLabels[confirmSlot.slot_type]}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Chcete potvrdit rezervaci tohoto termínu? Trenér ji ještě musí schválit.
              </p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Zrušit</Button>
            </DialogClose>
            <Button onClick={handleBook} disabled={booking} className="gap-1.5">
              <Check className="h-4 w-4" /> {booking ? "Ukládám..." : "Potvrdit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
