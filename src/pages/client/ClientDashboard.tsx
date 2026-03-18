import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Calendar, Dumbbell, TrendingUp, MessageSquare, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { clients, bookings, workoutPlans, progressEntries, coaches } from "@/lib/demo-data";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";

const CLIENT_ID = "cl2";

export default function ClientDashboard() {
  const client = clients.find(c => c.id === CLIENT_ID)!;
  const coach = coaches.find(c => c.id === client.coachId)!;
  const myBookings = bookings.filter(b => b.clientId === CLIENT_ID && b.status === "booked").sort((a, b) => a.startTime.localeCompare(b.startTime));
  const myPlans = workoutPlans.filter(p => p.clientId === CLIENT_ID && p.status === "active");
  const myProgress = progressEntries.filter(p => p.clientId === CLIENT_ID).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  const latestWeight = myProgress[0];

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title={`Ahoj, ${client.name.split(" ")[0]}!`} description="Tady je tvůj přehled." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Nadcházející lekce" value={myBookings.length} />
        <MetricCard label="Aktivní plány" value={myPlans.length} />
        <MetricCard label="Zbývající kredity" value={client.packageCredits} />
        <MetricCard label="Aktuální váha" value={latestWeight ? `${latestWeight.weight} kg` : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Můj trenér */}
        <div className="rounded-xl bg-card shadow-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Můj trenér</h2>
          <div className="flex items-center gap-3">
            <AvatarCircle initials={coach.avatar} size="md" />
            <div>
              <p className="text-sm font-medium text-foreground">{coach.name}</p>
              <p className="text-xs text-muted-foreground">{coach.specialties.join(", ")}</p>
              <Link to="/klient/zpravy" className="text-xs text-primary hover:underline font-medium mt-1 inline-block">
                Napsat zprávu
              </Link>
            </div>
          </div>
        </div>

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
          <div className="divide-y divide-border">
            {myBookings.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Žádné naplánované lekce.</p>
            ) : (
              myBookings.slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(parseISO(b.startTime), "EEEE, d. MMMM", { locale: cs })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(b.startTime), "H:mm", { locale: cs })} – {format(parseISO(b.endTime), "H:mm", { locale: cs })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{b.type === "1:1" ? "Individuální" : "Skupinová"}</span>
                </div>
              ))
            )}
          </div>
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
          <div className="divide-y divide-border">
            {myPlans.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Žádný aktivní plán.</p>
            ) : (
              myPlans.map((plan) => (
                <Link key={plan.id} to="/klient/treninky" className="block p-3 px-4 hover:bg-subtle transition-colors">
                  <p className="text-sm font-medium text-foreground">{plan.title}</p>
                  <p className="text-xs text-muted-foreground">{plan.exercises.length} cviků · <StatusBadge status="active" /></p>
                </Link>
              ))
            )}
          </div>
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
          <div className="divide-y divide-border">
            {myProgress.slice(0, 3).map((entry) => (
              <div key={entry.id} className="p-3 px-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{entry.weight} kg</p>
                  <span className="text-xs text-muted-foreground">{format(parseISO(entry.loggedAt), "d. MMM yyyy", { locale: cs })}</span>
                </div>
                {entry.notes && <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
