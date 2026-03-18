import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User, Dumbbell } from "lucide-react";

export default function RoleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const isClient = location.pathname.startsWith("/klient");

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full bg-card shadow-lg border border-border p-1">
      <button
        onClick={() => navigate("/dashboard")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          !isClient ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Dumbbell className="h-3.5 w-3.5" />
        Trenér
      </button>
      <button
        onClick={() => navigate("/klient")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          isClient ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <User className="h-3.5 w-3.5" />
        Klient
      </button>
    </div>
  );
}
