import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Calendar, Dumbbell, Users, AlertTriangle, ClipboardList, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function CoachDashboard() {
  const [profile, setProfile] = useState<{
    full_name: string;
    profile_photo_url: string | null;
    cover_photo_url: string | null;
    bg_preset: string | null;
  } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, profile_photo_url, cover_photo_url, bg_preset")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    };
    loadProfile();
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || "trenére";

  const bgPresetStyle: React.CSSProperties = {};
  if (profile?.bg_preset && profile.bg_preset !== "none") {
    const presets: Record<string, string> = {
      "blue-gradient": "linear-gradient(135deg, hsl(210 80% 92%), hsl(220 70% 85%))",
      "green-gradient": "linear-gradient(135deg, hsl(140 60% 90%), hsl(160 50% 82%))",
      "purple-gradient": "linear-gradient(135deg, hsl(270 60% 92%), hsl(290 50% 85%))",
      "orange-gradient": "linear-gradient(135deg, hsl(30 80% 92%), hsl(20 70% 85%))",
      "dark-gradient": "linear-gradient(135deg, hsl(220 20% 18%), hsl(220 15% 25%))",
    };
    if (presets[profile.bg_preset]) {
      bgPresetStyle.background = presets[profile.bg_preset];
      bgPresetStyle.minHeight = "100%";
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in" style={bgPresetStyle}>
      {/* Mobile quick actions */}
      <div className="flex gap-2 mb-4 md:hidden">
        <Link to="/clients" className="flex-1">
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-9">
            <UserPlus className="h-4 w-4" /> Klient
          </Button>
        </Link>
        <Link to="/training" className="flex-1">
          <Button size="sm" className="w-full gap-1.5 text-xs h-9">
            <Plus className="h-4 w-4" /> Plán
          </Button>
        </Link>
      </div>

      {profile?.cover_photo_url && (
        <div className="rounded-xl overflow-hidden mb-6 h-28 sm:h-40 w-full">
          <img
            src={profile.cover_photo_url}
            alt="Úvodní fotka"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={cn("flex items-center justify-between pb-4 sm:pb-6", profile?.cover_photo_url && "-mt-10 sm:-mt-12")}>
        <div className="flex items-center gap-3 sm:gap-4">
          {profile?.profile_photo_url && (
            <img
              src={profile.profile_photo_url}
              alt="Profilová fotka"
              className="h-16 w-16 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-background shadow-lg"
            />
          )}
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-foreground">Přehled</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{`Vítejte zpět, ${firstName}.`}</p>
          </div>
        </div>
        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/clients">
            <Button variant="outline" size="sm" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Přidat klienta
            </Button>
          </Link>
          <Link to="/training">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Nový plán
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <MetricCard label="Aktivní klienti" value={0} icon={Users} to="/clients" />
        <MetricCard label="Dnešní lekce" value={0} change="žádná lekce" icon={Clock} to="/calendar" />
        <MetricCard label="V ohrožení" value={0} icon={AlertTriangle} to="/clients" />
        <MetricCard label="Aktivní plány" value={0} icon={ClipboardList} to="/training" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Nadcházející lekce
            </h2>
            <Link to="/calendar" className="text-xs font-medium text-primary hover:underline">
              Zobrazit vše
            </Link>
          </div>
          <p className="p-4 text-sm text-muted-foreground">Zatím nemáte žádné naplánované lekce.</p>
        </div>

        <div className="rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Klienti v ohrožení</h2>
            <Link to="/clients" className="text-xs font-medium text-primary hover:underline">
              Zobrazit vše
            </Link>
          </div>
          <p className="p-4 text-sm text-muted-foreground">Žádní klienti v ohrožení. Dobrá práce.</p>

          <div className="border-t border-border">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" /> Aktivní plány
              </h2>
            </div>
            <p className="p-4 text-sm text-muted-foreground">Zatím nemáte žádné aktivní plány.</p>
          </div>
        </div>
      </div>
    </div>
  );
}