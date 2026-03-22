import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 690,
    description: "Pro začínající samostatné trenéry.",
    features: ["Až 15 klientů", "Tréninkové plány", "Základní sledování pokroku", "Kalendář a rezervace", "E-mailová podpora"],
    highlighted: false,
  },
  {
    name: "Professional",
    price: 1890,
    description: "Pro etablované trenéry rozšiřující praxi.",
    features: ["Neomezený počet klientů", "Pokročilé analytiky", "Samoobslužný rezervační portál", "Zprávy v aplikaci", "Sledování balíčků a plateb", "Prioritní podpora"],
    highlighted: true,
  },
  {
    name: "Studio",
    price: 3590,
    description: "Pro koučovací studia a týmy.",
    features: ["Vše z Professional", "Podpora více trenérů", "Administrátorský dashboard", "Ověření trenérů", "Vlastní branding", "API přístup", "Dedikovaná podpora"],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-subtle/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight text-foreground">Trenérník</Link>
          <div className="flex items-center gap-4">
            <Link to="/login"><Button variant="ghost" size="sm">Přihlásit se</Button></Link>
            <Link to="/register"><Button size="sm">Začít</Button></Link>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Jednoduchý a transparentní ceník
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Začněte zdarma. Upgradujte, až budete připraveni. Žádné skryté poplatky.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 flex flex-col ${
                plan.highlighted
                  ? "bg-foreground text-background shadow-elevated ring-2 ring-primary"
                  : "bg-card shadow-card"
              }`}
            >
              <h3 className={`text-lg font-semibold ${plan.highlighted ? "text-background" : "text-foreground"}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mt-1 ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                {plan.description}
              </p>
              <div className="mt-6 mb-6">
                <span className={`text-4xl font-semibold tabular-nums ${plan.highlighted ? "text-background" : "text-foreground"}`}>
                  {plan.price.toLocaleString('cs-CZ')} Kč
                </span>
                <span className={`text-sm ml-1 ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>/měsíc</span>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${plan.highlighted ? "text-primary" : "text-success"}`} />
                    <span className={plan.highlighted ? "text-background/80" : "text-muted-foreground"}>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button
                  className={`w-full gap-2 ${plan.highlighted ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  Začít <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
