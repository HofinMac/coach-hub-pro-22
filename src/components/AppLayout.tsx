import { cn } from "@/lib/utils";
import logoHorizontal from "@/assets/logo-trenernik-horizontal.png";
import logoIcon from "@/assets/logo-trenernik-icon.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Calendar,
  MessageSquare,
  CreditCard,
  Settings,
  ChevronLeft,
  LogOut,
  Shield,
  MapPin,
  Gift,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Přehled" },
  { to: "/clients", icon: Users, label: "Klienti" },
  { to: "/training", icon: Dumbbell, label: "Trénink" },
  { to: "/gyms", icon: MapPin, label: "Posilovny" },
  { to: "/calendar", icon: Calendar, label: "Kalendář" },
  { to: "/messages", icon: MessageSquare, label: "Zprávy" },
  { to: "/payments", icon: CreditCard, label: "Platby" },
  { to: "/benefits", icon: Gift, label: "Benefity" },
];

const bottomItems = [
  { to: "/admin", icon: Shield, label: "Administrace" },
  { to: "/settings", icon: Settings, label: "Nastavení" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Chyba při odhlašování", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-subtle transition-all duration-200",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex h-20 items-center justify-between px-4 border-b border-border">
          {!collapsed ? (
            <img src={logoHorizontal} alt="Trenérník" className="h-12" />
          ) : (
            <img src={logoIcon} alt="Trenérník" className="h-10 w-10" />
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
    </div>
  );
}
