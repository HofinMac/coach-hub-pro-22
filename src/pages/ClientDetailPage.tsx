import { useParams, Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Edit } from "lucide-react";
import { toast } from "sonner";
import { clients, getProgressByClient, workoutPlans } from "@/lib/demo-data";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function ClientDetailPage() {
  const { id } = useParams();
  const client = clients.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-muted-foreground">Klient nenalezen.</p>
        <Link to="/clients" className="text-primary text-sm hover:underline">← Zpět na klienty</Link>
      </div>
    );
  }

  const progress = getProgressByClient(client.id);
  const plans = workoutPlans.filter((p) => p.clientId === client.id);
  const chartData = progress.map((p) => ({
    date: p.loggedAt,
    weight: p.weight,
    bodyFat: p.bodyFat,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Klienti
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <AvatarCircle initials={client.avatar} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{client.name}</h1>
              <StatusBadge status={client.status} />
            </div>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> Zpráva</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><Edit className="h-3.5 w-3.5" /> Upravit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl bg-card shadow-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Detaily</h3>
            <InfoRow label="Cíle" value={client.goals} />
            <InfoRow label="Zranění" value={client.injuries || "Žádná"} />
            <InfoRow label="Kredity balíčku" value={String(client.packageCredits)} />
            <InfoRow label="Registrace" value={client.joinedAt} />
            {client.weight && <InfoRow label="Hmotnost" value={`${client.weight} kg`} />}
            {client.bodyFat && <InfoRow label="Tělesný tuk" value={`${client.bodyFat}%`} />}
          </div>

          <div className="rounded-xl bg-card shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Štítky</h3>
            <div className="flex flex-wrap gap-1.5">
              {client.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {chartData.length > 1 && (
            <div className="rounded-xl bg-card shadow-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Vývoj hmotnosti</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(250, 89%, 60%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(250, 89%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" width={40} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)", fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="hsl(250, 89%, 60%)" fill="url(#weightGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-xl bg-card shadow-card">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Tréninkové plány</h3>
            </div>
            {plans.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Žádné přiřazené plány.</p>
            ) : (
              <div className="divide-y divide-border">
                {plans.map((plan) => (
                  <div key={plan.id} className="p-4 hover:bg-subtle transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{plan.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.exercises.length} cviků · Vytvořeno {plan.createdAt}</p>
                      </div>
                      <StatusBadge status={plan.status as any} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.exercises.map((ex) => (
                        <span key={ex.exerciseId} className="text-xs bg-muted rounded-md px-2 py-1 font-mono text-muted-foreground">
                          {ex.exerciseName} · {ex.sets}×{ex.reps} · RPE {ex.rpe}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {progress.length > 0 && (
            <div className="rounded-xl bg-card shadow-card">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Záznam pokroku</h3>
              </div>
              <div className="divide-y divide-border">
                {[...progress].reverse().map((entry) => (
                  <div key={entry.id} className="p-4 flex items-start justify-between">
                    <div>
                      <p className="text-sm text-foreground">{entry.notes}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.loggedAt}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono tabular-nums text-foreground">{entry.weight} kg</p>
                      {entry.bodyFat && (
                        <p className="text-xs font-mono tabular-nums text-muted-foreground">{entry.bodyFat}% TT</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
