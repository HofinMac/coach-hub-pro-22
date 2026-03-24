import { cn } from "@/lib/utils";
import logoHorizontal from "@/assets/logo-trenernik-horizontal.png";
import logoIcon from "@/assets/logo-trenernik-icon.png";
import { NavLink, useNavigate } from "react-router-dom";
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
  MapPin,
  Trophy,
  MoreHorizontal,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
  { to: "/klient/vyzvy", icon: Trophy, label: "Výzvy" },
];

const bottomItems = [
  { to: "/klient/nastaveni", icon: Settings, label: "Nastavení" },
];

const mobileMainItems = navItems.slice(0, 4);
const mobileOverflowItems = [...navItems.slice(4), ...bottomItems];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Chyba při odhlašování", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-background safe-top">
        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>

        {mobileMore && (
          <div className="fixed inset-0 z-40" onClick={() => setMobileMore(false)}>
            <div className="absolute bottom-16 left-0 right-0 bg-card border-t border-border shadow-elevated rounded-t-2xl p-3 animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
              <div className="grid grid-cols-4 gap-1">
                {mobileOverflowItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/klient"}
                    onClick={() => setMobileMore(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex flex-col items-center gap-1 rounded-xl py-3 text-[10px] font-medium transition-colors",
                        isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <button
                  onClick={() => { setMobileMore(false); handleLogout(); }}
                  className="flex flex-col items-center gap-1 rounded-xl py-3 text-[10px] font-medium text-muted-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Odhlásit</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t border-border safe-bottom">
          <div className="flex items-center justify-around h-14 px-1">
            {mobileMainItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/klient"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-0.5 min-w-[3rem] py-1 text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => setMobileMore(!mobileMore)}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[3rem] py-1 text-[10px] font-medium transition-colors",
                mobileMore ? "text-primary" : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>Více</span>
            </button>
          </div>
        </nav>

        <WorkoutSessionPrompt />
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-subtle transition-all duration-200",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex h-24 items-center justify-between px-5 border-b border-border">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <img src={logoHorizontal} alt="Trenérník" className="h-20" />
              <span className="text-sm font-medium text-muted-foreground">klient</span>
            </div>
          ) : (
            <img src={logoIcon} alt="Trenérník" className="h-14 w-14" />
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
          <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Odhlásit se</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <WorkoutSessionPrompt />
    </div>
  );
}
