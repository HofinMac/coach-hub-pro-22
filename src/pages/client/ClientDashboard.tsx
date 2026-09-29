import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { Calendar, CalendarClock, Dumbbell, Flame, Scale, TrendingUp, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO, startOfMonth } from "date-fns";
import { cs } from "date-fns/locale";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { supabase } from "@/integrations/supabase/client";
import { from, type ProgressEntryRow, type WorkoutPlanRow } from "@/lib/db";

interface UpcomingSession {
  id: string;
  start_time: string;
  end_time: string;
  slot_type: string;
}

interface BookingWithSlot {
  id: string;
  coach_slots: UpcomingSession | null;
}

const slotTypeLabels: Record<string, string> = {
  individual: "Individuální trénink",
  online: "Online konzultace",
  group: "Skupinová lekce",
};

interface DashboardData {
  firstName: string;
  upcoming: UpcomingSession[];
  activePlans: Pick<WorkoutPlanRow, "id" | "title" | "exercises">[];
  workoutsThisMonth: number;
  latestEntries: Pick<ProgressEntryRow, "id" | "logged_at" | "weight" | "body_fat">[];
}

const EMPTY: DashboardData = { firstName: "", upcoming: [], activePlans: [], workoutsThisMonth: 0, latestEntries: [] };

export default function ClientDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (!cancelled) setData(EMPTY); return; }
        const nowIso = new Date().toISOString();
        const [profileRes, bookingsRes, plansRes, logsRes, progressRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
          supabase
            .from("slot_bookings")
            .select("id, coach_slots!inner(id, start_time, end_time, slot_type)")
            .eq("client_id", user.id)
            .in("status", ["confirmed", "pending"])
            .gte("coach_slots.start_time", nowIso),
          from("workout_plans")
            .select("id, title, exercises")
            .eq("client_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: false }),
          from("workout_logs")
            .select("id", { count: "exact", head: true })
            .eq("client_id", user.id)
            .gte("performed_at", startOfMonth(new Date()).toISOString()),
          from("progress_entries")
            .select("id, logged_at, weight, body_fat")
            .eq("client_id", user.id)
            .order("logged_at", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(3),
        ]);
        for (const res of [profileRes, bookingsRes, plansRes, logsRes, progressRes]) {
          if (res.error) console.error(res.error);
        }
        if (cancelled) return;
        const upcoming = ((bookingsRes.data ?? []) as unknown as BookingWithSlot[])
          .map(b => b.coach_slots)
          .filter((s): s is UpcomingSession => !!s)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
        setData({
          firstName: (profileRes.data?.full_name ?? "").trim().split(/\s+/)[0] ?? "",
          upcoming,
          activePlans: (plansRes.data ?? []) as DashboardData["activePlans"],
          workoutsThisMonth: logsRes.count ?? 0,
          latestEntries: (progressRes.data ?? []) as DashboardData["latestEntries"],
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setData(EMPTY);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loading = data === null;
  const next = data?.upcoming[0];
  const currentPlan = data?.activePlans[0];
  const latestWeight = data?.latestEntries.find(e => e.weight != null)?.weight;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <InstallAppBanner />
      <PageHeader title={data?.firstName ? `Ahoj, ${data.firstName}!` : "Ahoj!"} description="Tady je tvůj přehled." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Příští trénink"
          icon={CalendarClock}
          to="/klient/kalendar"
          value={loading ? "…" : next ? format(parseISO(next.start_time), "d. M.", { locale: cs }) : "—"}
          change={next ? format(parseISO(next.start_time), "EEEE H:mm", { locale: cs }) : undefined}
        />
        <MetricCard label="Aktivní plány" icon={ClipboardList} to="/klient/treninky" value={loading ? "…" : data.activePlans.length} />
        <MetricCard label="Tréninky tento měsíc" icon={Flame} to="/klient/treninky" value={loading ? "…" : data.workoutsThisMonth} />
        <MetricCard
          label="Aktuální váha"
          icon={Scale}
          to="/klient/pokrok"
          value={loading ? "…" : latestWeight != null ? `${Number(latestWeight).toLocaleString("cs-CZ")} kg` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nadcházející lekce */}
        <div className="rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Nadcházející lekce
            </h2>
            <Link to="/klient/kalendar" className="text-xs font-medium text-primary hover:underline">
              Zobrazit vše
            </Link>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Načítám…</p>
          ) : data.upcoming.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Žádné naplánované lekce.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.upcoming.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {format(parseISO(s.start_time), "EEEE d. M.", { locale: cs })}
                    </p>
                    <p className="text-xs text-muted-foreground">{slotTypeLabels[s.slot_type] ?? "Trénink"}</p>
                  </div>
                  <span className="text-sm font-mono tabular-nums text-foreground shrink-0">
                    {format(parseISO(s.start_time), "H:mm")}–{format(parseISO(s.end_time), "H:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aktuální tréninkový plán */}
        <div className="rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" /> Aktuální plán
            </h2>
            <Link to="/klient/treninky" className="text-xs font-medium text-primary hover:underline">
              Zobrazit vše
            </Link>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Načítám…</p>
          ) : !currentPlan ? (
            <p className="p-4 text-sm text-muted-foreground">Žádný aktivní plán.</p>
          ) : (
            <Link to="/klient/treninky" className="block p-4 hover:bg-accent/50 transition-colors rounded-b-xl">
              <p className="text-sm font-semibold text-foreground">{currentPlan.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(currentPlan.exercises ?? []).length} cviků
                {(currentPlan.exercises ?? []).length > 0 &&
                  ` · ${(currentPlan.exercises ?? []).slice(0, 3).map(e => e.exerciseName).join(", ")}${(currentPlan.exercises ?? []).length > 3 ? "…" : ""}`}
              </p>
            </Link>
          )}
        </div>

        {/* Poslední pokrok */}
        <div className="rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" /> Poslední záznamy
            </h2>
            <Link to="/klient/pokrok" className="text-xs font-medium text-primary hover:underline">
              Zobrazit vše
            </Link>
          </div>
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Načítám…</p>
          ) : data.latestEntries.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Zatím žádné záznamy.</p>
          ) : (
            <div className="divide-y divide-border">
              {data.latestEntries.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 px-4">
                  <div className="flex items-center gap-3">
                    {e.weight != null && (
                      <span className="text-sm font-mono font-medium tabular-nums text-foreground">
                        {Number(e.weight).toLocaleString("cs-CZ")} kg
                      </span>
                    )}
                    {e.body_fat != null && (
                      <span className="text-xs text-muted-foreground">{Number(e.body_fat).toLocaleString("cs-CZ")} % tuk</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(e.logged_at), "d. M. yyyy", { locale: cs })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
