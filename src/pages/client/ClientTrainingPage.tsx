import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { CheckCircle2, History, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { LogWorkoutDialog } from "@/components/WorkoutSessionPrompt";
import { from, requireUserId, type WorkoutLogRow, type WorkoutPlanRow } from "@/lib/db";
import { toast } from "sonner";

const RECENT_LOGS = 10;

export default function ClientTrainingPage() {
  const [plans, setPlans] = useState<WorkoutPlanRow[]>([]);
  const [logs, setLogs] = useState<WorkoutLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [logDialog, setLogDialog] = useState<{ key: number; planId: string | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const uid = await requireUserId();
      const [plansRes, logsRes] = await Promise.all([
        from("workout_plans")
          .select("id, coach_id, client_id, title, description, status, exercises, completed_at, created_at, updated_at")
          .eq("client_id", uid)
          .in("status", ["active", "completed"])
          .order("created_at", { ascending: false }),
        from("workout_logs")
          .select("id, client_id, plan_id, performed_at, duration_min, rpe, notes")
          .eq("client_id", uid)
          .order("performed_at", { ascending: false })
          .limit(RECENT_LOGS),
      ]);
      if (plansRes.error) throw plansRes.error;
      if (logsRes.error) throw logsRes.error;
      // Active plans first, then completed; newest first within each group.
      const rows = (plansRes.data ?? []) as WorkoutPlanRow[];
      setPlans([...rows.filter(p => p.status === "active"), ...rows.filter(p => p.status !== "active")]);
      setLogs((logsRes.data ?? []) as WorkoutLogRow[]);
    } catch (err) {
      console.error(err);
      toast.error("Tréninky se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openLog = (planId: string | null) => setLogDialog(prev => ({ key: (prev?.key ?? 0) + 1, planId }));

  const activePlans = plans.filter(p => p.status === "active");
  const planTitle = (id: string | null) => (id && plans.find(p => p.id === id)?.title) || "Vlastní trénink";
  const logsCountFor = (planId: string) => logs.filter(l => l.plan_id === planId).length;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Tréninkové plány" description="Plány přiřazené od tvého trenéra.">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openLog(null)} disabled={loading}>
          <Plus className="h-3.5 w-3.5" /> Zapsat trénink
        </Button>
      </PageHeader>

      {loading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Načítám…</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {plans.length === 0 ? (
              <div className="rounded-xl bg-card shadow-card p-8 text-center">
                <p className="text-sm text-muted-foreground">Zatím nemáš žádný tréninkový plán. Jakmile ti ho trenér přiřadí, objeví se tady.</p>
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className="rounded-xl bg-card shadow-card">
                  <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-foreground">{plan.title}</h2>
                        <StatusBadge status={plan.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Přiřazeno {format(parseISO(plan.created_at), "d. M. yyyy", { locale: cs })}
                        {logsCountFor(plan.id) > 0 && ` · nedávno odcvičeno ${logsCountFor(plan.id)}×`}
                      </p>
                      {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                    </div>
                    {plan.status === "active" && (
                      <Button size="sm" className="gap-1.5 shrink-0" onClick={() => openLog(plan.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Dokončit trénink
                      </Button>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {(plan.exercises ?? []).map((ex, idx) => (
                      <div key={idx} className="p-3 px-4">
                        <p className="text-sm font-medium text-foreground">{ex.exerciseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.sets} × {ex.reps} · RPE {ex.rpe} · Odpočinek {ex.rest}s
                        </p>
                        {ex.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{ex.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl bg-card shadow-card">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" /> Poslední tréninky
              </h2>
            </div>
            {logs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Zatím žádný zapsaný trénink.</p>
            ) : (
              <div className="divide-y divide-border">
                {logs.map(log => (
                  <div key={log.id} className="p-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground truncate">{planTitle(log.plan_id)}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(parseISO(log.performed_at), "d. M. yyyy H:mm", { locale: cs })}
                      </span>
                    </div>
                    {(log.duration_min != null || log.rpe != null) && (
                      <p className="text-xs text-muted-foreground">
                        {[
                          log.duration_min != null && `${log.duration_min} min`,
                          log.rpe != null && `RPE ${log.rpe}`,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {logDialog && (
        <LogWorkoutDialog
          key={logDialog.key}
          open
          onOpenChange={(o) => !o && setLogDialog(null)}
          plans={activePlans.map(p => ({ id: p.id, title: p.title }))}
          defaultPlanId={logDialog.planId}
          onLogged={(log) => setLogs(prev => [log, ...prev].slice(0, RECENT_LOGS))}
        />
      )}
    </div>
  );
}
