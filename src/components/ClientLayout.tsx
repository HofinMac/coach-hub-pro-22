import { cn } from "@/lib/utils";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  MessageSquare,
  TrendingUp,
  CreditCard,
  Settings,
  ChevronLeft,
  LogOut,
  Bell,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import WorkoutSessionPrompt from "./WorkoutSessionPrompt";

const navItems = [
  { to: "/klient", icon: LayoutDashboard, label: "Přehled" },
  { to: "/klient/treninky", icon: Dumbbell, label: "Trénink" },
  { to: "/klient/kalendar", icon: Calendar, label: "Kalendář" },
  { to: "/klient/posilovny", icon: MapPin, label: "Posilovny" },
  { to: "/klient/pokrok", icon: TrendingUp, label: "Pokrok" },
  { to: "/klient/zpravy", icon: MessageSquare, label: "Zprávy" },
  { to: "/klient/platby", icon: CreditCard, label: "Balíčky" },
];

const bottomItems = [
  { to: "/klient/nastaveni", icon: Settings, label: "Nastavení" },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-subtle transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-foreground">
              apex <span className="text-xs font-normal text-muted-foreground ml-1">klient</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-2 pt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/klient"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-1 p-2 border-t border-border">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
          <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Odhlásit se</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <WorkoutSessionPrompt />

      {/* Demo trigger – for testing the workout prompt */}
      <button
        onClick={() => window.dispatchEvent(new Event("workout-prompt-demo"))}
        className="fixed bottom-4 left-4 z-50 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors"
        title="Demo: spustit výzvu k tréninku"
      >
        ⚡ Test prompt
      </button>
    </div>
  );
}
