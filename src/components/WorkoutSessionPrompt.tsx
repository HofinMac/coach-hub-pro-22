import { useState, useEffect, useCallback, useRef } from "react";
import { format, parseISO, subHours } from "date-fns";
import { cs } from "date-fns/locale";
import { Dumbbell, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { from, requireUserId, type WorkoutLogRow } from "@/lib/db";

const WORKOUT_LOG_COLUMNS = "id, client_id, plan_id, performed_at, duration_min, rpe, notes";
const NO_PLAN = "__none__";

interface LogWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Plans the workout can be linked to (the client's visible plans). */
  plans: { id: string; title: string }[];
  defaultPlanId?: string | null;
  /** ISO timestamp of the workout; defaults to now. */
  performedAt?: string;
  title?: string;
  description?: string;
  cancelLabel?: string;
  onLogged?: (log: WorkoutLogRow) => void;
}

/** Form for logging a finished workout into workout_logs. Mount with a fresh `key` per opening. */
export function LogWorkoutDialog({
  open, onOpenChange, plans, defaultPlanId = null, performedAt, title = "Dokončit trénink",
  description = "Zapiš si, jak trénink proběhl. Trenér uvidí tvůj záznam.", cancelLabel = "Zrušit", onLogged,
}: LogWorkoutDialogProps) {
  const [planId, setPlanId] = useState<string>(defaultPlanId ?? NO_PLAN);
  const [duration, setDuration] = useState("");
  const [rpe, setRpe] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const durationMin = duration.trim() ? Math.round(Number(duration)) : null;
    const rpeValue = rpe.trim() ? Number(rpe.replace(",", ".")) : null;
    if (durationMin !== null && (!Number.isFinite(durationMin) || durationMin < 0)) {
      toast.error("Délka tréninku musí být kladné číslo.");
      return;
    }
    if (rpeValue !== null && (!Number.isFinite(rpeValue) || rpeValue < 1 || rpeValue > 10)) {
      toast.error("RPE musí být mezi 1 a 10.");
      return;
    }
    setSaving(true);
    try {
      const uid = await requireUserId();
      const { data, error } = await from("workout_logs")
        .insert({
          client_id: uid,
          plan_id: planId === NO_PLAN ? null : planId,
          performed_at: performedAt ?? new Date().toISOString(),
          duration_min: durationMin,
          rpe: rpeValue,
          notes: notes.trim(),
        })
        .select(WORKOUT_LOG_COLUMNS)
        .single();
      if (error) throw error;
      toast.success("Trénink zapsán. Skvělá práce!");
      onLogged?.(data as WorkoutLogRow);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Trénink se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {plans.length > 0 && (
            <div className="grid gap-1.5">
              <Label className="text-xs">Plán</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PLAN}>Vlastní trénink (bez plánu)</SelectItem>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="log-duration" className="text-xs">Délka (min)</Label>
              <Input
                id="log-duration" type="number" inputMode="numeric" min={0} placeholder="např. 60"
                value={duration} onChange={e => setDuration(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="log-rpe" className="text-xs">Náročnost (RPE 1–10)</Label>
              <Input
                id="log-rpe" type="number" inputMode="decimal" min={1} max={10} step={0.5} placeholder="např. 7"
                value={rpe} onChange={e => setRpe(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="log-notes" className="text-xs">Poznámka</Label>
            <Textarea
              id="log-notes" rows={3} placeholder="Jak ses cítil/a, co šlo dobře, co bolelo…"
              value={notes} onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{cancelLabel}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Uložit trénink
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Post-session prompt ────────────────────────────────────────────────────

const HANDLED_KEY = "workout-prompt-handled";
const LOOKBACK_HOURS = 12;
const CHECK_INTERVAL_MS = 10 * 60_000;

function readHandled(): string[] {
  try {
    const raw = localStorage.getItem(HANDLED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function markHandled(bookingId: string) {
  try {
    const next = [...readHandled().filter(id => id !== bookingId), bookingId].slice(-50);
    localStorage.setItem(HANDLED_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable – the prompt may show again, which is harmless.
  }
}

interface FinishedSession {
  bookingId: string;
  startTime: string;
}

interface BookingWithSlot {
  id: string;
  coach_slots: { start_time: string; end_time: string; slot_type: string } | null;
}

/**
 * After a client's confirmed in-person session ended (within the last ~12 h) and
 * nothing has been logged since it started, ask them to log the workout.
 */
export default function WorkoutSessionPrompt() {
  const [session, setSession] = useState<FinishedSession | null>(null);
  const [plans, setPlans] = useState<{ id: string; title: string }[]>([]);
  const showingRef = useRef(false);

  const check = useCallback(async () => {
    if (showingRef.current) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date();
      const { data, error } = await supabase
        .from("slot_bookings")
        .select("id, coach_slots!inner(start_time, end_time, slot_type)")
        .eq("client_id", user.id)
        .in("status", ["confirmed", "completed"])
        .gte("coach_slots.end_time", subHours(now, LOOKBACK_HOURS).toISOString())
        .lte("coach_slots.end_time", now.toISOString());
      if (error) throw error;

      const handled = new Set(readHandled());
      const candidate = ((data ?? []) as unknown as BookingWithSlot[])
        .filter(b => b.coach_slots && b.coach_slots.slot_type !== "online" && !handled.has(b.id))
        .sort((a, b) => (b.coach_slots?.end_time ?? "").localeCompare(a.coach_slots?.end_time ?? ""))[0];
      const slot = candidate?.coach_slots;
      if (!candidate || !slot) return;

      const { data: logs, error: logError } = await from("workout_logs")
        .select("id")
        .eq("client_id", user.id)
        .gte("performed_at", slot.start_time)
        .limit(1);
      if (logError) throw logError;
      if ((logs ?? []).length > 0) {
        markHandled(candidate.id);
        return;
      }

      const { data: planRows } = await from("workout_plans")
        .select("id, title")
        .eq("client_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (showingRef.current) return;
      showingRef.current = true;
      setPlans((planRows ?? []) as { id: string; title: string }[]);
      setSession({ bookingId: candidate.id, startTime: slot.start_time });
    } catch (err) {
      console.error("Workout prompt check failed", err);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [check]);

  const close = () => {
    if (session) markHandled(session.bookingId);
    showingRef.current = false;
    setSession(null);
  };

  if (!session) return null;

  return (
    <LogWorkoutDialog
      key={session.bookingId}
      open
      onOpenChange={(o) => !o && close()}
      plans={plans}
      defaultPlanId={plans.length === 1 ? plans[0].id : null}
      performedAt={session.startTime}
      title="Jak šel trénink?"
      description={`Tvoje lekce ${format(parseISO(session.startTime), "EEEE d. M. 'v' H:mm", { locale: cs })} skončila. Zapiš si ji, ať máš přehled o pokroku.`}
      cancelLabel="Teď ne"
    />
  );
}
