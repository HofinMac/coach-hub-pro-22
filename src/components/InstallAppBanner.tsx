import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const DISMISS_KEY = "coach-hub-install-banner-dismissed";

export function InstallAppBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (isInstalled || dismissed) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 sm:p-4 mb-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Download className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Nainstalujte si Coach Hub</p>
        {isIOS ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            Klepněte na Sdílet <Share className="h-3 w-3 inline mx-0.5" /> a poté „Přidat na plochu" <PlusSquare className="h-3 w-3 inline mx-0.5" />.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">Rychlejší přístup přímo z plochy vašeho telefonu.</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {!isIOS && canInstall && (
            <Button size="sm" className="h-7 text-xs gap-1" onClick={promptInstall}>
              <Download className="h-3 w-3" /> Nainstalovat
            </Button>
          )}
          <Link to="/install" className="text-xs font-medium text-primary hover:underline">
            Návod
          </Link>
        </div>
      </div>
      <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Zavřít">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
