import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Bell, BellOff, BellRing, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const errorText = (err: unknown) => {
  const msg = (err as { message?: string })?.message ?? "";
  if (msg.includes("TOO_MANY")) return "Chvíli počkejte a zkuste to znovu.";
  if (msg.includes("NO_SUBSCRIPTION")) return "Toto zařízení není přihlášené k upozorněním.";
  return "Něco se nepovedlo. Zkuste to prosím znovu.";
};

/** Settings card: turn web push on/off for this device and send a test notification. */
export function PushNotificationsCard() {
  const { support, permission, subscribed, busy, enable, disable, sendTest } = usePushNotifications();

  const handleEnable = async () => {
    try {
      await enable();
      if (Notification.permission === "denied") {
        toast.error("Upozornění jsou v prohlížeči zablokovaná. Povolte je v nastavení prohlížeče.");
      } else if (Notification.permission === "granted") {
        toast.success("Upozornění zapnuta");
      }
    } catch (err) {
      console.error(err);
      toast.error(errorText(err));
    }
  };

  const handleTest = async () => {
    try {
      await sendTest();
      toast.success("Zkušební upozornění odesláno, mělo by dorazit během pár vteřin.");
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const handleDisable = async () => {
    try {
      await disable();
      toast.success("Upozornění na tomto zařízení vypnuta");
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Upozornění na tomto zařízení
        </CardTitle>
        <CardDescription>
          Zprávy, rezervace, plány a připomínky tréninků se zobrazí jako notifikace, i když aplikaci nemáte otevřenou.
          Které události chcete dostávat, nastavíte níže ve sloupci Push.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {support === "ios-needs-install" && (
          <p className="text-sm text-muted-foreground">
            Na iPhonu a iPadu fungují upozornění jen v aplikaci přidané na plochu (iOS 16.4 a novější).{" "}
            <Link to="/install" className="font-medium text-primary hover:underline">Jak aplikaci nainstalovat</Link>
          </p>
        )}

        {support === "unsupported" && (
          <p className="text-sm text-muted-foreground">Tento prohlížeč upozornění nepodporuje.</p>
        )}

        {support === "supported" && permission === "denied" && (
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <BellOff className="h-4 w-4 mt-0.5 shrink-0" />
            Upozornění jsou pro Coach Hub v prohlížeči zablokovaná. Povolte je v nastavení prohlížeče nebo telefonu a vraťte se sem.
          </p>
        )}

        {support === "supported" && permission !== "denied" && !subscribed && (
          <Button onClick={handleEnable} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Zapnout upozornění
          </Button>
        )}

        {support === "supported" && subscribed && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-success" /> Upozornění jsou na tomto zařízení zapnutá.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleTest} disabled={busy}>
                Poslat zkušební upozornění
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisable} disabled={busy} className="text-muted-foreground">
                Vypnout
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
