import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { toast } from "sonner";
import { Check, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { rpc, type InvitationStatus } from "@/lib/db";
import { invitationStatusLabel, respondErrorText } from "@/lib/invitations";

interface MyInvitation {
  id: string;
  token: string;
  status: InvitationStatus;
  start_time: string;
  end_time: string;
  slot_type: string;
  notes: string;
  coach_name: string;
  closed: boolean;
  full: boolean;
}

const slotTypeLabels: Record<string, string> = { individual: "Individuální trénink", online: "Online konzultace", group: "Skupinová lekce" };

/** Client calendar: lesson invitations from the coach with Jdu / Nejdu. */
export function ClientInvitations({ onChanged }: { onChanged?: () => void }) {
  const [rows, setRows] = useState<MyInvitation[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await rpc("get_my_slot_invitations");
    if (error) { console.error(error); return; }
    setRows((data as MyInvitation[]).filter(r => !r.closed));
  }, []);

  useEffect(() => { load(); }, [load]);

  const respond = async (inv: MyInvitation, accept: boolean) => {
    setBusy(inv.id);
    try {
      const { error } = await rpc("respond_to_slot_invitation", { _token: inv.token, _accept: accept });
      if (error) throw error;
      toast.success(accept ? "Super, trenér ví, že přijdeš" : "Trenér ví, že nepřijdeš");
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(respondErrorText(err));
    } finally {
      setBusy(null);
    }
  };

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl bg-card shadow-card mb-6">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" /> Pozvánky na lekce
        </h2>
      </div>
      <div className="divide-y divide-border">
        {rows.map(inv => (
          <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {slotTypeLabels[inv.slot_type] ?? "Lekce"} · {inv.coach_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(inv.start_time), "EEEE d. MMMM, H:mm", { locale: cs })}–{format(parseISO(inv.end_time), "H:mm")}
              </p>
              {inv.notes && <p className="text-xs text-muted-foreground mt-0.5">{inv.notes}</p>}
              {inv.full && inv.status !== "accepted" && <p className="text-xs text-warning mt-0.5">Lekce je plně obsazená.</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {inv.status !== "pending" && <Badge variant={inv.status === "accepted" ? "default" : "secondary"}>{invitationStatusLabel[inv.status]}</Badge>}
              {inv.status !== "accepted" && (
                <Button size="sm" className="gap-1" disabled={busy === inv.id || inv.full} onClick={() => respond(inv, true)}>
                  <Check className="h-3.5 w-3.5" /> Jdu
                </Button>
              )}
              {inv.status !== "declined" && (
                <Button size="sm" variant="outline" className="gap-1" disabled={busy === inv.id} onClick={() => respond(inv, false)}>
                  <X className="h-3.5 w-3.5" /> Nejdu
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
