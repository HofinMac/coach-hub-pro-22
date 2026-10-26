import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Smartphone, Trash2, UserPlus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { from, rpc, type SlotInvitationRow } from "@/lib/db";
import { InvitePicker } from "@/components/InvitePicker";
import { emptyInviteSelection, invitationStatusLabel, inviteCount, inviteErrorText, inviteToSlot, parseEmails, type InviteSelection } from "@/lib/invitations";

const statusVariant: Record<SlotInvitationRow["status"], "outline" | "default" | "secondary"> = {
  pending: "outline",
  accepted: "default",
  declined: "secondary",
  withdrawn: "secondary",
};

/** Invitations of one slot in the coach's slot detail: who is invited, answers, invite more. */
export function SlotInvitations({ slotId, canInvite, onChanged }: { slotId: string; canInvite: boolean; onChanged?: () => void }) {
  const [rows, setRows] = useState<SlotInvitationRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [selection, setSelection] = useState<InviteSelection>(emptyInviteSelection);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await from("slot_invitations").select("*").eq("slot_id", slotId)
      .neq("status", "withdrawn").order("created_at");
    if (error) { console.error(error); setRows([]); return; }
    setRows(data as SlotInvitationRow[]);
  }, [slotId]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (parseEmails(selection.emailsText).invalid.length > 0) { toast.error("Opravte neplatné e-maily."); return; }
    if (inviteCount(selection) === 0) { toast.error("Vyberte klienty nebo zadejte e-maily."); return; }
    setBusy(true);
    try {
      const r = await inviteToSlot(slotId, selection.clientIds, parseEmails(selection.emailsText).emails);
      if (r.created === 0) toast.info("Všichni vybraní už pozvánku mají.");
      else if (r.emailFailed > 0) toast.warning(`Pozvánky vytvořeny, ${r.emailFailed} e-mailů se nepodařilo odeslat.`);
      else toast.success("Pozvánky odeslány");
      setSelection(emptyInviteSelection);
      setAdding(false);
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(inviteErrorText(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await rpc("withdraw_slot_invitation", { _id: id });
    if (error) { toast.error("Pozvánku se nepodařilo zrušit."); return; }
    setRows(prev => prev?.filter(r => r.id !== id) ?? null);
  };

  if (rows === null) return null;
  if (rows.length === 0 && !canInvite) return null;

  const accepted = rows.filter(r => r.status === "accepted").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          Pozvánky {rows.length > 0 && `(${accepted}/${rows.length} jde)`}
        </p>
        {canInvite && !adding && (
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setAdding(true)}>
            <UserPlus className="h-3 w-3" /> Pozvat
          </Button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {rows.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-2 p-2.5 text-sm">
              <div className="min-w-0 flex items-center gap-2">
                {r.client_id
                  ? <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-label="Klient v aplikaci" />
                  : <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-label="Pozvaný e-mailem" />}
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{r.name || r.email}</p>
                  {r.email && r.name && r.client_id === null && <p className="truncate text-xs text-muted-foreground">{r.email}</p>}
                  {r.email_error && (
                    <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> E-mail se nepodařilo odeslat</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={statusVariant[r.status]} className="text-[10px]">{invitationStatusLabel[r.status]}</Badge>
                {r.status !== "accepted" && canInvite && (
                  <button onClick={() => remove(r.id)} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Zrušit pozvánku">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <InvitePicker
            value={selection}
            onChange={setSelection}
            excludeClientIds={rows.filter(r => r.client_id).map(r => r.client_id!)}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setSelection(emptyInviteSelection); }}>Zpět</Button>
            <Button size="sm" onClick={send} disabled={busy}>{busy ? "Odesílám…" : "Odeslat pozvánky"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
