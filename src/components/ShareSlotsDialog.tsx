import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, Send, Copy, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { from, requireUserId, fetchCoachClients, type ProfileRow } from "@/lib/db";

export interface ShareableSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface ShareSlotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotCount: number;
  /** Optional: slots to offer. When omitted, the coach's upcoming free slots are loaded. */
  slots?: ShareableSlot[];
}

type ShareType = "all_clients" | "selected";

const MAX_LISTED = 40;

const slotLabel = (s: ShareableSlot) => {
  const start = parseISO(s.start_time);
  return `${format(start, "EEEE d. M.", { locale: cs })} ${format(start, "H:mm")}–${format(parseISO(s.end_time), "H:mm")}`;
};

function buildMessage(intro: string, slots: ShareableSlot[]) {
  const listed = slots.slice(0, MAX_LISTED).map(s => `• ${slotLabel(s)}`);
  if (slots.length > MAX_LISTED) listed.push(`… a dalších ${slots.length - MAX_LISTED} termínů`);
  return [
    intro.trim() || "Mám volné termíny, které si můžete zarezervovat:",
    "",
    ...listed,
    "",
    "Rezervovat můžete v aplikaci v sekci Kalendář.",
  ].join("\n").slice(0, 4000);
}

export default function ShareSlotsDialog({ open, onOpenChange, slotCount, slots: slotsProp }: ShareSlotsDialogProps) {
  const [shareType, setShareType] = useState<ShareType>("all_clients");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [coachId, setCoachId] = useState<string | null>(null);
  const [clients, setClients] = useState<ProfileRow[]>([]);
  const [loadedSlots, setLoadedSlots] = useState<ShareableSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const hasSlotsProp = !!slotsProp;
  const source = slotsProp ?? loadedSlots;
  const sourceKey = source.map(s => s.id).join(",");
  const slots = useMemo(() => {
    const now = Date.now();
    return source
      .filter(s => parseISO(s.start_time).getTime() >= now)
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const uid = await requireUserId();
        const [clientRows, slotRes] = await Promise.all([
          fetchCoachClients(uid),
          hasSlotsProp
            ? Promise.resolve(null)
            : supabase
                .from("coach_slots")
                .select("id, start_time, end_time")
                .eq("coach_id", uid)
                .in("status", ["available", "partially_booked"])
                .gte("start_time", new Date().toISOString())
                .order("start_time"),
        ]);
        if (slotRes?.error) throw slotRes.error;
        if (cancelled) return;
        setCoachId(uid);
        setClients(clientRows);
        if (slotRes) setLoadedSlots((slotRes.data ?? []) as ShareableSlot[]);
      } catch (err) {
        console.error(err);
        toast.error("Nepodařilo se načíst data pro sdílení");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, hasSlotsProp]);

  // Preselect all offered slots whenever the list changes
  useEffect(() => { setSelectedSlots(slots.map(s => s.id)); }, [slots, open]);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  const chosenSlots = slots.filter(s => selectedSlots.includes(s.id));
  const recipients = shareType === "all_clients" ? clients.map(c => c.id) : selectedClients;

  const handleCopy = async () => {
    if (chosenSlots.length === 0) { toast.error("Vyberte alespoň jeden termín"); return; }
    try {
      await navigator.clipboard.writeText(buildMessage(message, chosenSlots));
      toast.success("Text zkopírován do schránky");
    } catch {
      toast.error("Kopírování se nezdařilo");
    }
  };

  const handleShare = async () => {
    if (chosenSlots.length === 0) { toast.error("Vyberte alespoň jeden termín"); return; }
    if (recipients.length === 0) {
      toast.error(shareType === "selected" ? "Vyberte alespoň jednoho klienta" : "Zatím nemáte žádné klienty");
      return;
    }
    if (!coachId) return;
    setSending(true);
    try {
      const body = buildMessage(message, chosenSlots);
      const { error } = await from("messages").insert(
        recipients.map(clientId => ({ coach_id: coachId, client_id: clientId, sender_id: coachId, body })),
      );
      if (error) throw error;
      const { error: logError } = await supabase.from("slot_share_log").insert({
        coach_id: coachId,
        slot_ids: chosenSlots.map(s => s.id),
        share_type: shareType,
        recipient_ids: recipients,
        message: message.trim() || null,
      });
      if (logError) console.error(logError);
      toast.success(`Sdíleno ${chosenSlots.length} termínů s ${recipients.length} klienty`);
      setMessage("");
      setSelectedClients([]);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Sdílení se nezdařilo");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sdílet volné termíny ({loading ? slotCount : chosenSlots.length})</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Termíny</Label>
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nemáte žádné nadcházející volné termíny.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                  {slots.map(s => (
                    <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer">
                      <Checkbox
                        checked={selectedSlots.includes(s.id)}
                        onCheckedChange={() => setSelectedSlots(prev => toggle(prev, s.id))}
                      />
                      <span className="text-sm">{slotLabel(s)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Komu sdílet</Label>
              <Select value={shareType} onValueChange={v => setShareType(v as ShareType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_clients">
                    <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Všem klientům ({clients.length})</span>
                  </SelectItem>
                  <SelectItem value="selected">
                    <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Vybraným klientům</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {shareType === "selected" && (
              <div className="grid gap-2">
                <Label>Vyberte klienty</Label>
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Zatím nemáte žádné klienty.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                    {clients.map(c => (
                      <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer">
                        <Checkbox
                          checked={selectedClients.includes(c.id)}
                          onCheckedChange={() => setSelectedClients(prev => toggle(prev, c.id))}
                        />
                        <span className="text-sm">{c.full_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label>Zpráva (volitelné)</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Nové termíny na příští týden jsou k dispozici!"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Klienti dostanou zprávu se seznamem vybraných termínů v sekci Zprávy.
              </p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">Zrušit</Button>
          </DialogClose>
          <Button variant="secondary" onClick={handleCopy} disabled={loading || chosenSlots.length === 0}>
            <Copy className="h-4 w-4 mr-1.5" /> Kopírovat text
          </Button>
          <Button onClick={handleShare} disabled={loading || sending || chosenSlots.length === 0}>
            {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />} Sdílet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
