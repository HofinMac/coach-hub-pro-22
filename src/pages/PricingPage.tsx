import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 29,
    description: "For independent trainers getting started.",
    features: ["Up to 15 clients", "Training plans", "Basic progress tracking", "Calendar & bookings", "Email support"],
    highlighted: false,
  },
  {
    name: "Professional",
    price: 79,
    description: "For established coaches scaling their practice.",
    features: ["Unlimited clients", "Advanced analytics", "Client self-booking portal", "In-app messaging", "Package & payment tracking", "Priority support"],
    highlighted: true,
  },
  {
    name: "Studio",
    price: 149,
    description: "For coaching studios and teams.",
    features: ["Everything in Professional", "Multi-coach support", "Admin dashboard", "Coach verification", "Custom branding", "API access", "Dedicated support"],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-subtle/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight text-foreground">apex</Link>
          <div className="flex items-center gap-4">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/register"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Start free. Upgrade when you're ready. No hidden fees.
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
                  ${plan.price}
                </span>
                <span className={`text-sm ml-1 ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>/month</span>
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
                  Get started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
