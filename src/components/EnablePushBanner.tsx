import { useState } from "react";
import { toast } from "sonner";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { isStandalone } from "@/lib/push";

const DISMISS_KEY = "coach-hub-push-banner-dismissed";

const readDismissed = () => {
  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
};

/**
 * Dashboard prompt to turn on notifications. On phones it waits until the app is
 * installed (InstallAppBanner covers that step first).
 */
export function EnablePushBanner() {
  const { support, permission, subscribed, busy, enable } = usePushNotifications();
  const [dismissed, setDismissed] = useState(readDismissed);
  const isPhone = /Android|iPhone|iPad|iPod/.test(navigator.userAgent);

  if (dismissed || subscribed || support !== "supported" || permission !== "default") return null;
  if (isPhone && !isStandalone()) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* storage unavailable */ }
    setDismissed(true);
  };

  const handleEnable = async () => {
    try {
      await enable();
      if (Notification.permission === "granted") toast.success("Upozornění zapnuta");
    } catch (err) {
      console.error(err);
      toast.error("Upozornění se nepodařilo zapnout. Zkuste to v Nastavení.");
    }
  };

  return (
    <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 sm:p-4 mb-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Bell className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Zapněte si upozornění</p>
        <p className="text-xs text-muted-foreground mt-0.5">Nové zprávy, rezervace a připomínky tréninků vám pošleme jako notifikaci.</p>
        <Button size="sm" className="h-7 text-xs gap-1 mt-2" onClick={handleEnable} disabled={busy}>
          <Bell className="h-3 w-3" /> Zapnout
        </Button>
      </div>
      <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Zavřít">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
