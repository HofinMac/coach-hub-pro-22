import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { getProgressByClient, clients } from "@/lib/demo-data";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const CLIENT_ID = "cl2";

export default function ClientProgressPage() {
  const client = clients.find(c => c.id === CLIENT_ID)!;
  const progress = getProgressByClient(CLIENT_ID);
  const chartData = progress.map(p => ({
    date: format(parseISO(p.loggedAt), "d. MMM", { locale: cs }),
    weight: p.weight,
    bodyFat: p.bodyFat,
  }));

  const first = progress[0];
  const last = progress[progress.length - 1];
  const weightDiff = first && last ? (last.weight - first.weight).toFixed(1) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Sledování pokroku" description="Tvoje měření a vývoj.">
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nový záznam
        </Button>
      </PageHeader>

      {/* Weight summary */}
      {weightDiff && (
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-card shadow-card">
          {Number(weightDiff) < 0 ? (
            <TrendingDown className="h-5 w-5 text-success" />
          ) : (
            <TrendingUp className="h-5 w-5 text-primary" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {Number(weightDiff) > 0 ? "+" : ""}{weightDiff} kg od začátku
            </p>
            <p className="text-xs text-muted-foreground">
              {first.weight} kg → {last.weight} kg
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="rounded-xl bg-card shadow-card p-4 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Vývoj hmotnosti</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Váha (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Všechny záznamy</h2>
        </div>
        <div className="divide-y divide-border">
          {progress.slice().reverse().map((entry) => (
            <div key={entry.id} className="p-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono font-medium text-foreground tabular-nums">{entry.weight} kg</span>
                  {entry.bodyFat && (
                    <span className="text-xs text-muted-foreground">{entry.bodyFat}% tuk</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(entry.loggedAt), "d. MMMM yyyy", { locale: cs })}
                </span>
              </div>
              {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
