import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchCoachClients, requireUserId, rpc, type ProfileRow } from "@/lib/db";
import { InvitePicker } from "@/components/InvitePicker";
import { emptyInviteSelection, inviteCount, inviteErrorText, inviteToSlot, parseEmails, type InviteSelection } from "@/lib/invitations";

interface CreateSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  /** "HH:mm" — e.g. from tapping an hour in the calendar; the slot defaults to 60 min. */
  defaultStartTime?: string;
  onCreated?: () => void;
}

type Who = "free" | "app" | "manual";

const WHO_OPTIONS: Array<{ value: Who; label: string }> = [
  { value: "free", label: "Volný" },
  { value: "app", label: "Z aplikace" },
  { value: "manual", label: "Mimo aplikaci" },
];

const plusHour = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

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

/** Mount with a fresh `key` per opening so the defaults apply. */
export default function CreateSlotDialog({ open, onOpenChange, defaultDate, defaultStartTime, onCreated }: CreateSlotDialogProps) {
  const [date, setDate] = useState(defaultDate || format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(defaultStartTime ?? "09:00");
  const [endTime, setEndTime] = useState(plusHour(defaultStartTime ?? "09:00"));
  const [slotType, setSlotType] = useState("individual");
  const [capacity, setCapacity] = useState("1");
  const [notes, setNotes] = useState("");
  const [who, setWho] = useState<Who>("free");
  const occupied = who === "manual";
  const [manualClientName, setManualClientName] = useState("");
  const [appClientId, setAppClientId] = useState("");
  const [clients, setClients] = useState<ProfileRow[]>([]);

  useEffect(() => {
    if (!open) return;
    requireUserId().then(fetchCoachClients).then(setClients).catch(() => setClients([]));
  }, [open]);
  const [invites, setInvites] = useState<InviteSelection>(emptyInviteSelection);
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
    const canInvite = slotType === "group" && recurrence === "none" && !occupied;
    if (canInvite && parseEmails(invites.emailsText).invalid.length > 0) {
      toast.error("Opravte neplatné e-maily v pozvánkách.");
      return;
    }
    if (who === "app" && !appClientId) {
      toast.error("Vyberte klienta.");
      return;
    }
    if (occupied && !manualClientName.trim()) {
      toast.error("Doplňte, kdo termín obsadil.");
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
        status?: string;
        manual_client_name?: string;
      }> = [];
      // Occupied by a client outside the app: hidden from app clients, shows the name in the calendar.
      const occupancy = occupied ? { status: "booked", manual_client_name: manualClientName.trim() } : {};

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
          ...occupancy,
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
            start_time: toLocalISO(dateStr, startTime),
            end_time: toLocalISO(dateStr, endTime),
            slot_type: slotType,
            capacity: cap,
            notes,
            recurrence_rule: recRule,
            ...occupancy,
          });
          currentDate = addDays(currentDate, increment);
        }
      }

      const { data: created, error } = await supabase
        .from("coach_slots" as any)
        .insert(slots as any)
        .select("id");

      if (error) throw error;

      toast.success(`Vytvořeno ${slots.length} ${slots.length === 1 ? "slot" : "slotů"}`);

      const createdIds = ((created as unknown as Array<{ id: string }> | null) ?? []).map(c => c.id);
      const slotId = createdIds[0];
      if (who === "app" && createdIds.length > 0) {
        const { error: bookError } = await rpc("coach_book_client", { _slot_ids: createdIds, _client_id: appClientId });
        if (bookError) toast.error("Termín vytvořen, ale klienta se nepodařilo zapsat.");
        else toast.success(`${clients.find(c => c.id === appClientId)?.full_name || "Klient"} zapsán${createdIds.length > 1 ? ` na ${createdIds.length} termínů` : ""}`);
      }
      if (canInvite && slotId && inviteCount(invites) > 0) {
        try {
          const r = await inviteToSlot(slotId, invites.clientIds, parseEmails(invites.emailsText).emails);
          if (r.emailFailed > 0) toast.warning(`Pozvánky vytvořeny, ${r.emailFailed} e-mailů se nepodařilo odeslat.`);
          else toast.success(`Odesláno ${r.created} ${r.created === 1 ? "pozvánka" : r.created < 5 ? "pozvánky" : "pozvánek"}`);
        } catch (err) {
          toast.error(inviteErrorText(err));
        }
      }
      setInvites(emptyInviteSelection);
      setWho("free");
      setManualClientName("");
      setAppClientId("");
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{who === "free" ? "Nový volný termín" : "Nový termín"}</DialogTitle>
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
          <div className="rounded-lg border border-border p-3 space-y-3">
            <Label>Kdo přijde</Label>
            <div role="radiogroup" aria-label="Kdo přijde" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              {WHO_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={who === o.value}
                  onClick={() => setWho(o.value)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    who === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {who === "free" && (
              <p className="text-xs text-muted-foreground">Klienti si termín zarezervují v aplikaci.</p>
            )}
            {who === "app" && (
              clients.length === 0 ? (
                <p className="text-xs text-muted-foreground">Zatím nemáte žádné klienty v aplikaci.</p>
              ) : (
                <>
                  <Select value={appClientId} onValueChange={setAppClientId}>
                    <SelectTrigger aria-label="Klient"><SelectValue placeholder="Vyberte klienta" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Klienta rovnou zapíšeme, dostane notifikaci.</p>
                </>
              )
            )}
            {occupied && (
              <Input
                value={manualClientName}
                onChange={e => setManualClientName(e.target.value)}
                placeholder="Jméno klienta, např. Pavel Novák"
                maxLength={120}
                autoFocus
              />
            )}
            {occupied && (
              <p className="text-xs text-muted-foreground">Termín se klientům v aplikaci nenabídne, v kalendáři uvidíte jméno.</p>
            )}
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
          {slotType === "group" && who !== "manual" && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div>
                <Label>Pozvat na lekci (volitelné)</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {recurrence === "none"
                    ? "Po uložení rozešleme pozvánky. Klienti v aplikaci potvrdí v aplikaci, ostatní kliknutím v e-mailu."
                    : "Pozvánky jdou poslat jen u jednorázové lekce. U opakované je pošlete z detailu konkrétního termínu."}
                </p>
              </div>
              {recurrence === "none" && <InvitePicker value={invites} onChange={setInvites} />}
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
