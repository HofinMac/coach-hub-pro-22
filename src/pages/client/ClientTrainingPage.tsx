import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { workoutPlans } from "@/lib/demo-data";

const CLIENT_ID = "cl2";

export default function ClientTrainingPage() {
  const myPlans = workoutPlans.filter(p => p.clientId === CLIENT_ID);

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Tréninkové plány" description="Plány přiřazené od tvého trenéra." />

      <div className="space-y-4">
        {myPlans.length === 0 ? (
          <div className="rounded-xl bg-card shadow-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Zatím nemáš žádný tréninkový plán.</p>
          </div>
        ) : (
          myPlans.map((plan) => (
            <div key={plan.id} className="rounded-xl bg-card shadow-card">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{plan.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Vytvořeno: {plan.createdAt}</p>
                </div>
                <StatusBadge status={plan.status} />
              </div>
              <div className="divide-y divide-border">
                {plan.exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{ex.exerciseName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.sets} × {ex.reps} · RPE {ex.rpe} · Odpočinek {ex.rest}s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
