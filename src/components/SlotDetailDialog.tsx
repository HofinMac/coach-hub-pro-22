import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Check, X, Clock, CalendarX, CalendarClock, UserX } from "lucide-react";

interface SlotWithBookings {
  id: string;
  start_time: string;
  end_time: string;
  slot_type: string;
  capacity: number;
  booked_count: number;
  status: string;
  notes: string | null;
  bookings: Array<{
    id: string;
    client_id: string;
    status: string;
    client_name?: string;
  }>;
}

interface SlotDetailDialogProps {
  slot: SlotWithBookings | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const slotTypeLabels: Record<string, string> = {
  individual: "Individuální",
  online: "Online konzultace",
  group: "Skupinová lekce",
};

const statusLabels: Record<string, string> = {
  available: "Volný",
  partially_booked: "Částečně obsazený",
  booked: "Obsazený",
  cancelled: "Zrušený",
  completed: "Dokončeno",
  no_show: "Neúčast",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "outline",
  partially_booked: "secondary",
  booked: "default",
  cancelled: "destructive",
  completed: "default",
  no_show: "destructive",
};

export default function SlotDetailDialog({ slot, open, onOpenChange, onUpdated }: SlotDetailDialogProps) {
  const [action, setAction] = useState<"none" | "cancel" | "reschedule" | "complete" | "no_show">("none");
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  if (!slot) return null;

  const startDate = new Date(slot.start_time);
  const endDate = new Date(slot.end_time);
  const isPast = startDate < new Date();
  const hasBookings = slot.bookings.length > 0;
  const confirmedBookings = slot.bookings.filter(b => b.status === "confirmed" || b.status === "pending");

  const resetAction = () => {
    setAction("none");
    setReason("");
    setNewDate("");
    setNewStartTime("");
    setNewEndTime("");
  };

  const handleApproveBooking = async (bookingId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("slot_bookings")
        .update({ status: "confirmed" } as any)
        .eq("id", bookingId);
      if (error) throw error;
      toast.success("Rezervace schválena");
      onUpdated();
    } catch (err: any) {
      toast.error("Chyba: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("slot_bookings")
        .update({ status: "rejected" } as any)
        .eq("id", bookingId);
      if (error) throw error;

      // Decrement booked_count
      await supabase
        .from("coach_slots")
        .update({ booked_count: Math.max(0, slot.booked_count - 1), status: "available" } as any)
        .eq("id", slot.id);

      toast.success("Rezervace zamítnuta");
      onUpdated();
    } catch (err: any) {
      toast.error("Chyba: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async () => {
    if (action === "cancel" && !reason.trim()) {
      toast.error("Uveďte důvod zrušení");
      return;
    }
    if (action === "reschedule" && (!newDate || !newStartTime || !newEndTime)) {
      toast.error("Vyplňte nový datum a čas");
      return;
    }

    setSaving(true);
    try {
      if (action === "complete") {
        await supabase.from("coach_slots").update({ status: "completed" } as any).eq("id", slot.id);
        // Mark all confirmed bookings as completed
        for (const b of confirmedBookings) {
          await supabase.from("slot_bookings").update({ status: "completed" } as any).eq("id", b.id);
        }
        toast.success("Termín označen jako dokončený");
      } else if (action === "no_show") {
        await supabase.from("coach_slots").update({ status: "no_show", notes: `Neúčast: ${reason || "bez důvodu"}` } as any).eq("id", slot.id);
        for (const b of confirmedBookings) {
          await supabase.from("slot_bookings").update({ status: "no_show" } as any).eq("id", b.id);
        }
        toast.success("Termín označen jako neúčast");
      } else if (action === "cancel") {
        await supabase.from("coach_slots").update({ status: "cancelled", notes: `Zrušeno: ${reason}` } as any).eq("id", slot.id);
        for (const b of confirmedBookings) {
          await supabase.from("slot_bookings").update({ status: "cancelled" } as any).eq("id", b.id);
        }
        toast.success("Termín zrušen");
      } else if (action === "reschedule") {
        // Cancel old slot
        await supabase.from("coach_slots").update({ status: "cancelled", notes: `Přeloženo: ${reason || "nový termín"}` } as any).eq("id", slot.id);
        for (const b of confirmedBookings) {
          await supabase.from("slot_bookings").update({ status: "cancelled" } as any).eq("id", b.id);
        }
        // Create new slot
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newSlot } = await supabase.from("coach_slots").insert({
            coach_id: user.id,
            start_time: (() => { const dt = new Date(`${newDate}T${newStartTime}:00`); const o = -dt.getTimezoneOffset(); const s = o >= 0 ? "+" : "-"; return `${newDate}T${newStartTime}:00${s}${String(Math.floor(Math.abs(o)/60)).padStart(2,"0")}:${String(Math.abs(o)%60).padStart(2,"0")}`; })(),
            end_time: (() => { const dt = new Date(`${newDate}T${newEndTime}:00`); const o = -dt.getTimezoneOffset(); const s = o >= 0 ? "+" : "-"; return `${newDate}T${newEndTime}:00${s}${String(Math.floor(Math.abs(o)/60)).padStart(2,"0")}:${String(Math.abs(o)%60).padStart(2,"0")}`; })(),
            slot_type: slot.slot_type,
            capacity: slot.capacity,
            notes: `Přeloženo z ${format(startDate, "d.M. H:mm", { locale: cs })}`,
          } as any).select().single();

          // Re-book confirmed clients to new slot
          if (newSlot) {
            for (const b of confirmedBookings) {
              await supabase.from("slot_bookings").insert({
                slot_id: (newSlot as any).id,
                client_id: b.client_id,
                status: "confirmed",
              } as any);
            }
            await supabase.from("coach_slots").update({
              booked_count: confirmedBookings.length,
              status: confirmedBookings.length >= slot.capacity ? "booked" : confirmedBookings.length > 0 ? "partially_booked" : "available",
            } as any).eq("id", (newSlot as any).id);
          }
        }
        toast.success("Termín přeložen na nový datum");
      }

      resetAction();
      onOpenChange(false);
      onUpdated();
    } catch (err: any) {
      toast.error("Chyba: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAction(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detail termínu</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Slot info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {format(startDate, "EEEE, d. MMMM yyyy", { locale: cs })}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(startDate, "H:mm")} – {format(endDate, "H:mm")} · {slotTypeLabels[slot.slot_type] || slot.slot_type}
              </p>
            </div>
            <Badge variant={statusVariants[slot.status] || "secondary"}>
              {statusLabels[slot.status] || slot.status}
            </Badge>
          </div>

          {slot.notes && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2">{slot.notes}</p>
          )}

          {/* Bookings list */}
          {slot.bookings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Rezervace ({slot.bookings.length})</p>
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {slot.bookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{b.client_name || "Klient"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{
                        b.status === "pending" ? "Čeká na schválení" :
                        b.status === "confirmed" ? "Potvrzeno" :
                        b.status === "completed" ? "Dokončeno" :
                        b.status === "cancelled" ? "Zrušeno" :
                        b.status === "no_show" ? "Neúčast" :
                        b.status === "rejected" ? "Zamítnuto" : b.status
                      }</p>
                    </div>
                    {b.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-destructive" disabled={saving}
                          onClick={() => handleRejectBooking(b.id)}>
                          <X className="h-3 w-3" /> Zamítnout
                        </Button>
                        <Button size="sm" className="h-7 gap-1" disabled={saving}
                          onClick={() => handleApproveBooking(b.id)}>
                          <Check className="h-3 w-3" /> Schválit
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {action === "none" && slot.status !== "cancelled" && slot.status !== "completed" && slot.status !== "no_show" && (
            <div className="flex flex-wrap gap-2">
              {hasBookings && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAction("complete")}>
                  <Check className="h-3.5 w-3.5" /> Hotovo
                </Button>
              )}
              {hasBookings && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAction("no_show")}>
                  <UserX className="h-3.5 w-3.5" /> Nepřišel
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAction("reschedule")}>
                <CalendarClock className="h-3.5 w-3.5" /> Přeložit
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => setAction("cancel")}>
                <CalendarX className="h-3.5 w-3.5" /> Zrušit
              </Button>
            </div>
          )}

          {/* Action forms */}
          {action === "cancel" && (
            <div className="space-y-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-sm font-semibold text-destructive">Zrušit termín</p>
              <Label>Důvod zrušení *</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Např. nemoc, osobní důvody..." rows={2} />
            </div>
          )}

          {action === "reschedule" && (
            <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold text-primary">Přeložit na nový termín</p>
              <div className="grid gap-2">
                <Label>Nový datum</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Od</Label>
                  <Input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} />
                </div>
                <div>
                  <Label>Do</Label>
                  <Input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Důvod (volitelné)</Label>
                <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Důvod přeložení..." rows={2} />
              </div>
            </div>
          )}

          {action === "no_show" && (
            <div className="space-y-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <p className="text-sm font-semibold text-warning">Označit jako neúčast</p>
              <Label>Poznámka (volitelné)</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Poznámka k neúčasti..." rows={2} />
            </div>
          )}

          {action === "complete" && (
            <div className="space-y-2 p-3 rounded-lg bg-success/5 border border-success/20">
              <p className="text-sm font-semibold text-success">Označit jako dokončený</p>
              <p className="text-xs text-muted-foreground">Termín a všechny potvrzené rezervace budou označeny jako dokončené.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {action !== "none" ? (
            <>
              <Button variant="outline" onClick={resetAction}>Zpět</Button>
              <Button onClick={handleAction} disabled={saving}>
                {saving ? "Ukládám..." : "Potvrdit"}
              </Button>
            </>
          ) : (
            <DialogClose asChild>
              <Button variant="outline">Zavřít</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
