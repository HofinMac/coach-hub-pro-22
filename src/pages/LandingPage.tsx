import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Dumbbell, Calendar, BarChart3, Shield, Zap, Smartphone } from "lucide-react";
import logoHorizontal from "@/assets/logo-coachhub-horizontal.png";

const features = [
  { icon: Users, title: "Správa klientů", desc: "Kompletní CRM se sledováním stavu, poznámkami, zraněními a historií pokroku." },
  { icon: Dumbbell, title: "Tréninkové plány", desc: "Tvorba a přiřazení tréninků s knihovnou cviků, sériemi, opakováními, RPE a šablonami." },
  { icon: Calendar, title: "Rezervační systém", desc: "Samoobslužné plánování s potvrzeními, rušením a čekacími listinami." },
  { icon: BarChart3, title: "Sledování pokroku", desc: "Tělesné metriky, výkonnostní data, fotky a automatická upozornění na stagnaci." },
  { icon: Shield, title: "Obchodní nástroje", desc: "Balíčky, platby, faktury a správa kreditů za lekce." },
  { icon: Zap, title: "Dashboard trenéra", desc: "Rychlý přehled klientů, rezervací a klientů v ohrožení." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-subtle/50 backdrop-blur-sm sticky top-0 z-50 safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-24 px-6">
          <Link to="/"><img src={logoHorizontal} alt="Coach Hub" className="h-20" /></Link>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Ceník
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">Přihlásit se</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Začít</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            Klienti pod kontrolou.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg">
            Coach Hub spojuje správu klientů, tréninkové plány, rezervace a sledování pokroku do jedné platformy vytvořené pro profesionální trenéry.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Vyzkoušet zdarma <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg">Zobrazit demo</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl p-6 bg-card shadow-card group hover:shadow-elevated transition-shadow">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-2xl bg-foreground p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-semibold text-background">Coach Hub v kapse</h3>
            <p className="text-sm text-background/60 mt-1.5 max-w-md">
              Nainstalujte si Coach Hub na mobil jako aplikaci — přímo z prohlížeče, bez App Store. Funguje offline i na iPhonu.
            </p>
          </div>
          <Link to="/install">
            <Button size="lg" variant="secondary" className="gap-2 shrink-0">
              Nainstalovat <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-subtle">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Vytvořeno pro trenéry, kteří to myslí vážně.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Nahraďte svůj slepenec nástrojů jednou ucelenou platformou. Začněte během minut.
          </p>
          <Link to="/register" className="mt-6 inline-block">
            <Button size="lg" className="gap-2">
              Začít zdarma <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">© 2026 Coach Hub. Všechna práva vyhrazena.</span>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Ochrana soukromí</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Podmínky</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
