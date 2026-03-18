import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { workoutPlans, exercises, type ExerciseCategory } from "@/lib/demo-data";
import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { Link } from "react-router-dom";

const categoryLabels: Record<ExerciseCategory, string> = {
  knee_dominant: "Knee Dominant",
  hip_dominant: "Hip Dominant",
  push: "Push",
  pull: "Pull",
  core: "Core",
  conditioning: "Conditioning",
  mobility: "Mobility",
};

export default function TrainingPage() {
  const [tab, setTab] = useState<'plans' | 'exercises'>('plans');

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Training" description="Plans and exercise library">
        <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New plan</Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(['plans', 'exercises'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <div className="space-y-3">
          {workoutPlans.map(plan => (
            <div key={plan.id} className="rounded-xl bg-card shadow-card p-5 hover:shadow-elevated transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{plan.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <Link to={`/clients/${plan.clientId}`} className="hover:text-primary transition-colors">
                      {plan.clientName}
                    </Link>
                    {' '}· {plan.createdAt}
                  </p>
                </div>
                <StatusBadge status={plan.status as any} />
              </div>
              <div className="rounded-lg bg-subtle overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Exercise</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">Sets</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">Reps</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">RPE</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Rest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {plan.exercises.map((ex, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-sm font-medium text-foreground">{ex.exerciseName}</td>
                        <td className="px-3 py-2 text-sm text-center font-mono tabular-nums text-foreground">{ex.sets}</td>
                        <td className="px-3 py-2 text-sm text-center font-mono tabular-nums text-foreground">{ex.reps}</td>
                        <td className="px-3 py-2 text-sm text-center font-mono tabular-nums text-foreground">{ex.rpe}</td>
                        <td className="px-3 py-2 text-sm text-right font-mono tabular-nums text-muted-foreground">{ex.rest}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'exercises' && (
        <div className="space-y-6">
          {(Object.keys(categoryLabels) as ExerciseCategory[]).map(cat => {
            const catExercises = exercises.filter(e => e.category === cat);
            if (catExercises.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {categoryLabels[cat]}
                </h3>
                <div className="rounded-xl bg-card shadow-card divide-y divide-border">
                  {catExercises.map(ex => (
                    <div key={ex.id} className="flex items-center justify-between p-3 px-4 hover:bg-subtle transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">{ex.defaultNotes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
