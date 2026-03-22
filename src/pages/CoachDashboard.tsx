import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Calendar, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import {
  bookings,
  getClientsByCoach,
  getAtRiskClients,
  getUpcomingBookings,
  workoutPlans,
} from "@/lib/demo-data";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const COACH_ID = "c1";

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

  const myClients = getClientsByCoach(COACH_ID);
  const atRisk = getAtRiskClients(COACH_ID);
  const upcoming = getUpcomingBookings(COACH_ID);
  const activePlans = workoutPlans.filter((p) => p.coachId === COACH_ID && p.status === "active");
  const activeCount = myClients.filter((c) => c.status === "active").length;
  const todayBookings = bookings.filter(
    (b) => b.coachId === COACH_ID && b.startTime.startsWith("2026-03-18")
  );

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
    <div className="p-6 max-w-6xl mx-auto animate-fade-in" style={bgPresetStyle}>
      {profile?.cover_photo_url && (
        <div className="rounded-xl overflow-hidden mb-6 h-40 w-full">
          <img
            src={profile.cover_photo_url}
            alt="Úvodní fotka"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={cn("flex items-center justify-between pb-6", profile?.cover_photo_url && "-mt-12")}>
        <div className="flex items-center gap-4">
          {profile?.profile_photo_url && (
            <img
              src={profile.profile_photo_url}
              alt="Profilová fotka"
              className="h-24 w-24 rounded-full object-cover border-4 border-background shadow-lg"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Přehled</h1>
            <p className="text-sm text-muted-foreground mt-1">{`Vítejte zpět, ${firstName}.`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Aktivní klienti" value={activeCount} change="+2 tento měsíc" changeType="positive" />
        <MetricCard label="Dnešní lekce" value={todayBookings.length} />
        <MetricCard label="V ohrožení" value={atRisk.length} change="vyžaduje pozornost" changeType="negative" />
        <MetricCard label="Aktivní plány" value={activePlans.length} />
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
          <div className="divide-y divide-border">
            {upcoming.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 px-4 hover:bg-subtle transition-colors">
                <div className="flex items-center gap-3">
                  <AvatarCircle initials={booking.clientName.split(" ").map((n) => n[0]).join("")} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{booking.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(booking.startTime), "EEE, d. MMM · H:mm", { locale: cs })}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{booking.type === '1:1' ? 'Individuální' : 'Skupinová'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Klienti v ohrožení</h2>
            <Link to="/clients" className="text-xs font-medium text-primary hover:underline">
              Zobrazit vše
            </Link>
          </div>
          <div className="divide-y divide-border">
            {atRisk.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Žádní klienti v ohrožení. Dobrá práce.</p>
            ) : (
              atRisk.map((client) => (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  className="flex items-center justify-between p-3 px-4 hover:bg-subtle transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <AvatarCircle initials={client.avatar} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Poslední aktivita: {format(parseISO(client.lastActivity), "d. MMM", { locale: cs })}
                      </p>
                    </div>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 text-xs font-medium text-primary transition-opacity">
                    Napsat
                  </span>
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-border">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" /> Aktivní plány
              </h2>
            </div>
            <div className="divide-y divide-border">
              {activePlans.map((plan) => (
                <Link
                  key={plan.id}
                  to="/training"
                  className="flex items-center justify-between p-3 px-4 hover:bg-subtle transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{plan.title}</p>
                    <p className="text-xs text-muted-foreground">{plan.clientName} · {plan.exercises.length} cviků</p>
                  </div>
                  <StatusBadge status="active" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}