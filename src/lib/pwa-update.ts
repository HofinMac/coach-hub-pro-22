/**
 * Service worker registration with an explicit "new version" prompt.
 * Installed PWAs (especially on iOS) resume instead of reloading, so without this
 * users keep running an old build for days. We check for updates on start, when the
 * app comes back to the foreground and hourly, then offer a one-tap reload.
 */
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

const HOUR = 60 * 60 * 1000;

export function setupPwaUpdates() {
  if (!("serviceWorker" in navigator)) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      toast("Je k dispozici nová verze aplikace", {
        description: "Aktualizace trvá pár vteřin. Rozpracované změny si nejdřív uložte.",
        duration: Infinity,
        action: { label: "Aktualizovat", onClick: () => updateSW(true) },
      });
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => registration.update().catch(() => { /* offline */ });
      setInterval(check, HOUR);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
  });
}
