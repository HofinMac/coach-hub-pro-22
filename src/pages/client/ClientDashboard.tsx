import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { Calendar, Dumbbell, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function ClientDashboard() {
  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Ahoj!" description="Tady je tvůj přehled." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Nadcházející lekce" value={0} />
        <MetricCard label="Aktivní plány" value={0} />
        <MetricCard label="Zbývající kredity" value={0} />
        <MetricCard label="Aktuální váha" value="—" />
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
          <p className="p-4 text-sm text-muted-foreground">Žádné naplánované lekce.</p>
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
          <p className="p-4 text-sm text-muted-foreground">Žádný aktivní plán.</p>
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
          <p className="p-4 text-sm text-muted-foreground">Zatím žádné záznamy.</p>
        </div>
      </div>
    </div>
  );
}
