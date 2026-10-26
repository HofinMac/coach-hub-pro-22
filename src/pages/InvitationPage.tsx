import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarDays, Check, Loader2, X } from "lucide-react";
import logoHorizontal from "@/assets/logo-coachhub-horizontal.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rpc, type InvitationStatus } from "@/lib/db";
import { respondErrorText } from "@/lib/invitations";

interface InvitationInfo {
  status: InvitationStatus;
  name: string;
  coach_name: string;
  start_time: string;
  end_time: string;
  slot_type: string;
  notes: string;
  closed: boolean;
  full: boolean;
}

const slotTypeLabels: Record<string, string> = { individual: "Individuální trénink", online: "Online konzultace", group: "Skupinová lekce" };

/**
 * Public page behind the "Jdu / Nejdu" links in invitation e-mails (/pozvanka/:token?odpoved=ano|ne).
 * Nothing is saved on load — mail scanners open links — the visitor confirms with a button.
 */
export default function InvitationPage() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const preselected = params.get("odpoved") === "ano" ? true : params.get("odpoved") === "ne" ? false : null;

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAnswered, setJustAnswered] = useState(false);

  useEffect(() => {
    rpc("get_slot_invitation", { _token: token }).then(({ data, error }: { data: InvitationInfo | null; error: unknown }) => {
      if (error || !data) setState("missing");
      else { setInfo(data); setState("ready"); }
    });
  }, [token]);

  const answer = async (accept: boolean) => {
    setSaving(true);
    setError(null);
    const { data, error } = await rpc("respond_to_slot_invitation", { _token: token, _accept: accept });
    setSaving(false);
    if (error) { setError(respondErrorText(error)); return; }
    setInfo(data as InvitationInfo);
    setJustAnswered(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-start sm:items-center justify-center p-4 safe-top">
      <div className="w-full max-w-md space-y-6 py-8">
        <img src={logoHorizontal} alt="Coach Hub" className="h-20 mx-auto" />

        {state === "loading" && (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        )}

        {state === "missing" && (
          <div className="rounded-xl bg-card shadow-card p-6 text-center space-y-2">
            <h1 className="text-lg font-semibold text-foreground">Pozvánka nenalezena</h1>
            <p className="text-sm text-muted-foreground">Odkaz je neplatný nebo trenér pozvánku zrušil.</p>
          </div>
        )}

        {state === "ready" && info && (
          <div className="rounded-xl bg-card shadow-card p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{info.coach_name} vás zve na lekci</p>
              <h1 className="text-xl font-semibold text-foreground">{slotTypeLabels[info.slot_type] ?? "Lekce"}</h1>
              <p className="text-sm text-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {format(parseISO(info.start_time), "EEEE d. MMMM, H:mm", { locale: cs })}–{format(parseISO(info.end_time), "H:mm")}
              </p>
              {info.notes && <p className="text-sm text-muted-foreground">{info.notes}</p>}
            </div>

            {info.status !== "pending" && (
              <div className={cn(
                "rounded-lg p-3 text-sm font-medium flex items-center gap-2",
                info.status === "accepted" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
              )}>
                {info.status === "accepted" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {info.status === "accepted"
                  ? (justAnswered ? "Díky, trenér ví, že přijdete." : "Máte potvrzeno, že přijdete.")
                  : (justAnswered ? "Díky, trenér ví, že nepřijdete." : "Odpověděli jste, že nepřijdete.")}
              </div>
            )}

            {info.closed ? (
              <p className="text-sm text-muted-foreground">Lekce už začala nebo byla zrušena, odpověď už nejde změnit.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {info.status === "pending" ? "Potvrďte prosím, jestli přijdete:" : "Změnit odpověď:"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="lg"
                    className={cn("gap-2", preselected === true && info.status === "pending" && "ring-2 ring-offset-2 ring-primary")}
                    disabled={saving || info.status === "accepted" || info.full}
                    onClick={() => answer(true)}
                  >
                    <Check className="h-4 w-4" /> Jdu
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn("gap-2", preselected === false && info.status === "pending" && "ring-2 ring-offset-2 ring-primary")}
                    disabled={saving || info.status === "declined"}
                    onClick={() => answer(false)}
                  >
                    <X className="h-4 w-4" /> Nejdu
                  </Button>
                </div>
                {info.full && info.status !== "accepted" && (
                  <p className="text-xs text-warning">Lekce je už plně obsazená.</p>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Coach Hub – aplikace pro trenéry a jejich klienty
        </p>
      </div>
    </div>
  );
}
