import { useState, useEffect } from "react";
import { bookings, workoutPlans } from "@/lib/demo-data";
import { parseISO, isWithinInterval, addMinutes } from "date-fns";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Dumbbell, ClipboardList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CLIENT_ID = "cl2";

export default function WorkoutSessionPrompt() {
  const [activeBooking, setActiveBooking] = useState<typeof bookings[0] | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const current = bookings.find((b) => {
        if (b.clientId !== CLIENT_ID || b.status !== "booked") return false;
        if (dismissed.has(b.id)) return false;
        const start = parseISO(b.startTime);
        // Show prompt from 5 min before session start until 15 min after
        const windowStart = addMinutes(start, -5);
        const windowEnd = addMinutes(start, 15);
        return isWithinInterval(now, { start: windowStart, end: windowEnd });
      });
      setActiveBooking(current ?? null);
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [dismissed]);

  // For demo: also allow triggering manually via a global flag
  // In real app, this would only fire at the right time
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    const handler = () => setDemoOpen(true);
    window.addEventListener("workout-prompt-demo", handler);
    return () => window.removeEventListener("workout-prompt-demo", handler);
  }, []);

  const booking = activeBooking;
  const isOpen = !!booking || demoOpen;

  const plan = workoutPlans.find(
    (p) => p.clientId === CLIENT_ID && p.status === "active"
  );

  const handleFollowPlan = () => {
    if (booking) setDismissed((s) => new Set(s).add(booking.id));
    setDemoOpen(false);
    navigate("/klient/treninky", { state: { mode: "plan", planId: plan?.id } });
  };

  const handleManualEntry = () => {
    if (booking) setDismissed((s) => new Set(s).add(booking.id));
    setDemoOpen(false);
    navigate("/klient/treninky", { state: { mode: "manual" } });
  };

  const handleDismiss = () => {
    if (booking) setDismissed((s) => new Set(s).add(booking.id));
    setDemoOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Čas na trénink!
          </DialogTitle>
          <DialogDescription>
            {booking
              ? `Tvoje lekce začíná v ${format(parseISO(booking.startTime), "H:mm", { locale: cs })}. Jak chceš dnes cvičit?`
              : "Máš naplánovanou lekci. Jak chceš dnes cvičit?"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {plan && (
            <Button
              variant="outline"
              className="h-auto py-4 px-4 flex items-start gap-4 text-left border-primary/20 hover:bg-primary/5 hover:border-primary/40"
              onClick={handleFollowPlan}
            >
              <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Cvičit podle plánu</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {plan.title} · {plan.exercises.length} cviků
                </p>
              </div>
            </Button>
          )}

          <Button
            variant="outline"
            className="h-auto py-4 px-4 flex items-start gap-4 text-left hover:bg-accent"
            onClick={handleManualEntry}
          >
            <div className="rounded-lg bg-muted p-2.5 shrink-0">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Zadat cvičení ručně</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vyber si vlastní cviky a zaznamenej trénink
              </p>
            </div>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Můžeš to kdykoliv změnit během tréninku.
        </p>
      </DialogContent>
    </Dialog>
  );
}
