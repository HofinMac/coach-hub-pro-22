import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Dumbbell, Calendar, BarChart3, Shield, Zap } from "lucide-react";

const features = [
  { icon: Users, title: "Client Management", desc: "Full CRM with status tracking, notes, injuries, and progress history." },
  { icon: Dumbbell, title: "Training Plans", desc: "Build and assign workouts with exercise libraries, sets, reps, RPE, and templates." },
  { icon: Calendar, title: "Booking System", desc: "Self-service scheduling with confirmations, cancellations, and waitlists." },
  { icon: BarChart3, title: "Progress Tracking", desc: "Body metrics, performance data, photos, and automated stagnation alerts." },
  { icon: Shield, title: "Business Tools", desc: "Packages, payments, invoices, and session credit management." },
  { icon: Zap, title: "Coach Dashboard", desc: "At-a-glance overview of your roster, bookings, and at-risk clients." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-subtle/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <span className="text-lg font-semibold tracking-tight text-foreground">apex</span>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            Manage your roster,<br />not your spreadsheets.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg">
            Apex unifies client management, training plans, bookings, and progress tracking into one platform built for professional coaches.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg">View demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
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

      {/* CTA */}
      <section className="border-t border-border bg-subtle">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Built for coaches who take their craft seriously.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Replace your patchwork of tools with one focused platform. Start in minutes.
          </p>
          <Link to="/register" className="mt-6 inline-block">
            <Button size="lg" className="gap-2">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">© 2026 Apex. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
