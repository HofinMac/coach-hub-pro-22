import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Share, PlusSquare, Check, ArrowRight } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Nainstalujte si Trenérník
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
            Přidejte si Trenérník na domovskou obrazovku a používejte ho jako běžnou aplikaci.
          </p>
        </div>

        {isInstalled ? (
          <div className="rounded-xl bg-card shadow-card p-8">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Trenérník je nainstalován!</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Aplikaci najdete na domovské obrazovce svého zařízení.
            </p>
            <Link to="/dashboard" className="mt-6 inline-block">
              <Button className="gap-2">
                Otevřít aplikaci <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : isIOS ? (
          <div className="rounded-xl bg-card shadow-card p-6 text-left">
            <h2 className="text-sm font-semibold text-foreground mb-4">Postup instalace na iPhone:</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Klepněte na ikonu Sdílet</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    Najdete ji ve spodní liště Safari <Share className="h-3.5 w-3.5 inline" />
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Vyberte „Přidat na plochu"</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    Scrollujte dolů v menu <PlusSquare className="h-3.5 w-3.5 inline" />
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Potvrďte „Přidat"</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Trenérník se objeví na vaší ploše jako aplikace
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                ⚠️ Důležité: Na iPhonu musíte tuto stránku otevřít v <strong>Safari</strong>. Ostatní prohlížeče na iOS nepodporují instalaci na plochu.
              </p>
            </div>
          </div>
        ) : deferredPrompt ? (
          <div className="rounded-xl bg-card shadow-card p-8">
            <Button onClick={handleInstall} size="lg" className="gap-2">
              <Download className="h-5 w-5" /> Nainstalovat Apex
            </Button>
          </div>
        ) : (
          <div className="rounded-xl bg-card shadow-card p-6 text-left">
            <h2 className="text-sm font-semibold text-foreground mb-3">Postup instalace:</h2>
            <p className="text-sm text-muted-foreground">
              Otevřete menu prohlížeče (tři tečky) a vyberte „Nainstalovat aplikaci" nebo „Přidat na plochu".
            </p>
          </div>
        )}

        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-6 transition-colors">
          ← Zpět na hlavní stránku
        </Link>
      </div>
    </div>
  );
}
