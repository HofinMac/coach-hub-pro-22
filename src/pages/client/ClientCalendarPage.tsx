import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { bookings } from "@/lib/demo-data";
import { format, parseISO, addDays } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarPlus, Clock, Check, MapPin, Users, Monitor } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CLIENT_ID = "cl2";

const statusLabels: Record<string, string> = {
  pending: "Čeká na schválení",
  booked: "Potvrzeno",
  completed: "Dokončeno",
  cancelled: "Zrušeno",
  no_show: "Neúčast",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  booked: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
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

// Demo available slots from the coach
const demoSlots = [
  { id: "s1", date: "2026-03-19", startTime: "08:00", endTime: "09:00", type: "individual", available: true },
  { id: "s2", date: "2026-03-19", startTime: "10:00", endTime: "11:00", type: "online", available: true },
  { id: "s3", date: "2026-03-20", startTime: "09:00", endTime: "10:00", type: "individual", available: true },
  { id: "s4", date: "2026-03-20", startTime: "14:00", endTime: "15:00", type: "group", available: true },
  { id: "s5", date: "2026-03-21", startTime: "08:00", endTime: "09:00", type: "individual", available: true },
  { id: "s6", date: "2026-03-21", startTime: "11:00", endTime: "12:00", type: "individual", available: true },
  { id: "s7", date: "2026-03-22", startTime: "09:00", endTime: "10:00", type: "online", available: true },
  { id: "s8", date: "2026-03-23", startTime: "10:00", endTime: "11:30", type: "group", available: true },
];

export default function ClientCalendarPage() {
  const [confirmSlot, setConfirmSlot] = useState<typeof demoSlots[0] | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [view, setView] = useState<"slots" | "bookings">("slots");

  const myBookings = bookings
    .filter(b => b.clientId === CLIENT_ID)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleBook = () => {
    if (!confirmSlot) return;
    setBookedSlots(prev => [...prev, confirmSlot.id]);
    toast.success("Termín zarezervován!");
    setConfirmSlot(null);
  };

  // Group slots by date
  const slotsByDate = demoSlots.reduce((acc, slot) => {
    if (bookedSlots.includes(slot.id)) return acc;
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, typeof demoSlots>);

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Kalendář" description="Dostupné termíny a tvoje rezervace" />

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

      {view === "slots" ? (
        <div className="space-y-4">
          {Object.keys(slotsByDate).length === 0 ? (
            <div className="rounded-xl bg-card shadow-card p-8 text-center">
              <CalendarPlus className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Všechny termíny jsou zarezervované 🎉</p>
            </div>
          ) : (
            Object.entries(slotsByDate).map(([date, slots]) => (
              <div key={date}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {format(parseISO(date), "EEEE, d. MMMM yyyy", { locale: cs })}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map(slot => {
                    const Icon = slotTypeIcons[slot.type] || Users;
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
                              {slot.startTime} – {slot.endTime}
                            </p>
                            <p className="text-xs text-muted-foreground">{slotTypeLabels[slot.type]}</p>
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
                      {format(parseISO(b.startTime), "EEEE, d. MMMM yyyy", { locale: cs })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(b.startTime), "H:mm", { locale: cs })} – {format(parseISO(b.endTime), "H:mm", { locale: cs })} · {b.type === "1:1" ? "Individuální" : "Skupinová"}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[b.status]}`}>
                    {statusLabels[b.status]}
                  </span>
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
                    {format(parseISO(confirmSlot.date), "EEEE, d. MMMM", { locale: cs })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {confirmSlot.startTime} – {confirmSlot.endTime} · {slotTypeLabels[confirmSlot.type]}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Chcete potvrdit rezervaci tohoto termínu?
              </p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Zrušit</Button>
            </DialogClose>
            <Button onClick={handleBook} className="gap-1.5">
              <Check className="h-4 w-4" /> Potvrdit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
