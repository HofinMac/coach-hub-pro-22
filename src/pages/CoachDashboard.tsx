import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict, startOfDay, endOfDay, subDays, isToday } from "date-fns";
import { cs } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Calendar, Dumbbell, Users, AlertTriangle, ClipboardList, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { AvatarCircle } from "@/components/AvatarCircle";
import { from, rpc, requireUserId, fetchCoachClients, initialsOf, type ProfileRow } from "@/lib/db";

const INACTIVITY_DAYS = 14;

interface SlotRow {
  id: string;
  start_time: string;
  end_time: string;
  slot_type: string;
  status: string;
}

interface UpcomingSlot extends SlotRow {
  clientNames: string[];
}

interface AtRiskClient {
  client: ProfileRow;
  reason: string;
}

interface ActivePlan {
  id: string;
  title: string;
  exerciseCount: number;
  clientName: string;
}

const slotTypeLabels: Record<string, string> = {
  individual: "Individuální",
  online: "Online",
  group: "Skupinová",
};

async function loadDashboard() {
  const coachId = await requireUserId();
  const now = new Date();

  const slotCols = "id, start_time, end_time, slot_type, status";
  const [clients, recordsRes, activityRes, plansRes, todayRes, upcomingRes] = await Promise.all([
    fetchCoachClients(coachId),
    from("coach_client_records").select("client_id, status").eq("coach_id", coachId),
    rpc("get_client_last_activity", { _coach_id: coachId }),
    from("workout_plans")
      .select("id, title, client_id, exercises")
      .eq("coach_id", coachId)
      .eq("status", "active")
      .order("updated_at", { ascending: false }),
    supabase
      .from("coach_slots")
      .select(slotCols)
      .eq("coach_id", coachId)
      .neq("status", "cancelled")
      .gte("start_time", startOfDay(now).toISOString())
      .lte("start_time", endOfDay(now).toISOString())
      .order("start_time"),
    supabase
      .from("coach_slots")
      .select(slotCols)
      .eq("coach_id", coachId)
      .neq("status", "cancelled")
      .gte("start_time", now.toISOString())
      .order("start_time")
      .limit(5),
  ]);
  for (const res of [recordsRes, activityRes, plansRes, todayRes, upcomingRes]) {
    if (res.error) throw res.error;
  }

  const statusById = new Map<string, string>(
    ((recordsRes.data ?? []) as { client_id: string; status: string }[]).map(r => [r.client_id, r.status]),
  );
  const lastActivityById = new Map<string, string | null>(
    ((activityRes.data ?? []) as { client_id: string; last_activity: string | null }[]).map(r => [r.client_id, r.last_activity]),
  );
  const nameById = new Map(clients.map(c => [c.id, c.full_name]));

  const activeClients = clients.filter(c => statusById.get(c.id) !== "inactive");

  const threshold = subDays(now, INACTIVITY_DAYS);
  const atRisk: AtRiskClient[] = [];
  for (const client of activeClients) {
    const status = statusById.get(client.id);
    const last = lastActivityById.get(client.id);
    if (status === "at_risk") {
      atRisk.push({ client, reason: "Označen jako v ohrožení" });
    } else if (status === "lead") {
      continue;
    } else if (last && new Date(last) < threshold) {
      atRisk.push({ client, reason: `Naposledy aktivní ${formatDistanceToNowStrict(new Date(last), { addSuffix: true, locale: cs })}` });
    } else if (!last && new Date(client.created_at) < threshold) {
      atRisk.push({ client, reason: "Od registrace bez aktivity" });
    }
  }

  const plans: ActivePlan[] = ((plansRes.data ?? []) as { id: string; title: string; client_id: string | null; exercises: unknown[] }[]).map(p => ({
    id: p.id,
    title: p.title,
    exerciseCount: Array.isArray(p.exercises) ? p.exercises.length : 0,
    clientName: p.client_id ? nameById.get(p.client_id) ?? "Klient" : "Bez klienta",
  }));

  const upcomingSlots = (upcomingRes.data ?? []) as SlotRow[];
  const clientNamesBySlot = new Map<string, string[]>();
  if (upcomingSlots.length > 0) {
    const { data: bookings, error } = await supabase
      .from("slot_bookings")
      .select("slot_id, client_id, status")
      .in("slot_id", upcomingSlots.map(s => s.id))
      .in("status", ["confirmed", "pending", "completed"]);
    if (error) throw error;
    const missing = [...new Set((bookings ?? []).map(b => b.client_id))].filter(cid => !nameById.has(cid));
    if (missing.length > 0) {
      const { data: extra } = await supabase.from("profiles").select("id, full_name").in("id", missing);
      extra?.forEach(p => nameById.set(p.id, p.full_name));
    }
    for (const b of bookings ?? []) {
      const list = clientNamesBySlot.get(b.slot_id) ?? [];
      list.push(nameById.get(b.client_id) || "Klient");
      clientNamesBySlot.set(b.slot_id, list);
    }
  }

  const todaySlots = (todayRes.data ?? []) as SlotRow[];
  return {
    activeClientCount: activeClients.length,
    todayCount: todaySlots.length,
    nextToday: todaySlots.find(s => new Date(s.start_time) >= now) ?? null,
    atRisk,
    plans,
    upcoming: upcomingSlots.map<UpcomingSlot>(s => ({ ...s, clientNames: clientNamesBySlot.get(s.id) ?? [] })),
  };
}

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

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["coach-dashboard"],
    queryFn: loadDashboard,
  });

  const metric = (value: number | undefined) => (isLoading ? "–" : value ?? 0);
  const todayChange = !stats || isLoading
    ? undefined
    : stats.todayCount === 0
      ? "žádná lekce"
      : stats.nextToday
        ? `příští v ${format(new Date(stats.nextToday.start_time), "H:mm")}`
        : "vše odučeno";

  const panelMessage = (empty: string) => (
    <p className="p-4 text-sm text-muted-foreground">
      {isLoading ? "Načítám…" : isError ? "Data se nepodařilo načíst." : empty}
    </p>
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
    <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in" style={bgPresetStyle}>
      <InstallAppBanner />

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
        <MetricCard label="Aktivní klienti" value={metric(stats?.activeClientCount)} icon={Users} to="/clients" />
        <MetricCard label="Dnešní lekce" value={metric(stats?.todayCount)} change={todayChange} icon={Clock} to="/calendar" />
        <MetricCard
          label="V ohrožení"
          value={metric(stats?.atRisk.length)}
          changeType={stats?.atRisk.length ? "negative" : "neutral"}
          icon={AlertTriangle}
          to="/clients"
        />
        <MetricCard label="Aktivní plány" value={metric(stats?.plans.length)} icon={ClipboardList} to="/training" />
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
          {stats?.upcoming.length ? (
            <div className="divide-y divide-border">
              {stats.upcoming.map(slot => {
                const start = new Date(slot.start_time);
                return (
                  <Link key={slot.id} to="/calendar" className="flex items-center justify-between gap-3 p-4 hover:bg-subtle transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {slot.clientNames.length > 0 ? slot.clientNames.join(", ") : "Volný termín"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {slotTypeLabels[slot.slot_type] || slot.slot_type}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono tabular-nums text-foreground">
                        {format(start, "H:mm")}–{format(new Date(slot.end_time), "H:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {isToday(start) ? "Dnes" : format(start, "EEEE d. M.", { locale: cs })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : panelMessage("Zatím nemáte žádné naplánované lekce.")}
        </div>

        <div className="rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Klienti v ohrožení</h2>
            <Link to="/clients" className="text-xs font-medium text-primary hover:underline">
              Zobrazit vše
            </Link>
          </div>
          {stats?.atRisk.length ? (
            <div className="divide-y divide-border">
              {stats.atRisk.slice(0, 5).map(({ client, reason }) => (
                <Link key={client.id} to={`/clients/${client.id}`} className="flex items-center gap-3 p-4 hover:bg-subtle transition-colors">
                  <AvatarCircle initials={initialsOf(client.full_name)} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{client.full_name || client.email}</p>
                    <p className="text-xs text-destructive mt-0.5">{reason}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : panelMessage("Žádní klienti v ohrožení. Dobrá práce.")}

          <div className="border-t border-border">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" /> Aktivní plány
              </h2>
            </div>
            {stats?.plans.length ? (
              <div className="divide-y divide-border">
                {stats.plans.slice(0, 5).map(plan => (
                  <Link key={plan.id} to="/training" className="flex items-center justify-between gap-3 p-4 hover:bg-subtle transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{plan.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{plan.clientName}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{plan.exerciseCount} cviků</span>
                  </Link>
                ))}
              </div>
            ) : panelMessage("Zatím nemáte žádné aktivní plány.")}
          </div>
        </div>
      </div>
    </div>
  );
}