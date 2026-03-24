import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";

interface CreateSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  onCreated?: () => void;
}

const SLOT_TYPES = [
  { value: "individual", label: "Individuální trénink" },
  { value: "online", label: "Online konzultace" },
  { value: "group", label: "Skupinová lekce" },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Jednorázový" },
  { value: "daily", label: "Každý den" },
  { value: "weekly", label: "Každý týden" },
  { value: "biweekly", label: "Každé 2 týdny" },
];

export default function CreateSlotDialog({ open, onOpenChange, defaultDate, onCreated }: CreateSlotDialogProps) {
  const [date, setDate] = useState(defaultDate || format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [slotType, setSlotType] = useState("individual");
  const [capacity, setCapacity] = useState("1");
  const [notes, setNotes] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Build a proper local ISO string with timezone offset
  const toLocalISO = (dateStr: string, timeStr: string) => {
    const dt = new Date(`${dateStr}T${timeStr}:00`);
    const offset = -dt.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
    const mm = String(Math.abs(offset) % 60).padStart(2, "0");
    return `${dateStr}T${timeStr}:00${sign}${hh}:${mm}`;
  };

  const handleSave = async () => {
    if (!date || !startTime || !endTime) {
      toast.error("Vyplňte datum a čas.");
      return;
    }
    if (startTime >= endTime) {
      toast.error("Čas konce musí být po čase začátku.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Nejste přihlášen/a"); return; }

      const slots: Array<{
        coach_id: string;
        start_time: string;
        end_time: string;
        slot_type: string;
        capacity: number;
        notes: string;
        recurrence_rule: any;
      }> = [];

      const cap = slotType === "group" ? parseInt(capacity) || 1 : 1;
      const recRule = recurrence !== "none" ? { frequency: recurrence, endDate: recurrenceEndDate || null } : null;

      if (recurrence === "none") {
        slots.push({
          coach_id: user.id,
          start_time: toLocalISO(date, startTime),
          end_time: toLocalISO(date, endTime),
          slot_type: slotType,
          capacity: cap,
          notes,
          recurrence_rule: recRule,
        });
      } else {
        // Generate recurring slots
        const endDateObj = recurrenceEndDate ? new Date(recurrenceEndDate) : addDays(new Date(date), 56); // 8 weeks default
        let currentDate = new Date(date);
        const increment = recurrence === "daily" ? 1 : recurrence === "weekly" ? 7 : 14;

        while (currentDate <= endDateObj) {
          const dateStr = format(currentDate, "yyyy-MM-dd");
          slots.push({
            coach_id: user.id,
            start_time: `${dateStr}T${startTime}:00`,
            end_time: `${dateStr}T${endTime}:00`,
            slot_type: slotType,
            capacity: cap,
            notes,
            recurrence_rule: recRule,
          });
          currentDate = addDays(currentDate, increment);
        }
      }

      const { error } = await supabase
        .from("coach_slots" as any)
        .insert(slots as any);

      if (error) throw error;

      toast.success(`Vytvořeno ${slots.length} ${slots.length === 1 ? "slot" : "slotů"}`);
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      console.error(err);
      toast.error("Chyba: " + (err.message || "Nepodařilo se vytvořit slot"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nový volný termín</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Datum</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Od</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Do</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Typ lekce</Label>
            <Select value={slotType} onValueChange={setSlotType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLOT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {slotType === "group" && (
            <div className="grid gap-2">
              <Label>Kapacita (max. osob)</Label>
              <Input type="number" min={2} max={50} value={capacity} onChange={e => setCapacity(e.target.value)} className="w-24" />
            </div>
          )}
          <div className="grid gap-2">
            <Label>Opakování</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {recurrence !== "none" && (
            <div className="grid gap-2">
              <Label>Opakovat do</Label>
              <Input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">Pokud necháte prázdné, vytvoří se sloty na 8 týdnů</p>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Poznámka (volitelné)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Např. pouze pro pokročilé..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Zrušit</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Ukládám..." : "Vytvořit termín"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
