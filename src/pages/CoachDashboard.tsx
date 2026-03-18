import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Calendar, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import {
  clients,
  bookings,
  getClientsByCoach,
  getAtRiskClients,
  getUpcomingBookings,
  workoutPlans,
} from "@/lib/demo-data";
import { format, parseISO } from "date-fns";

const COACH_ID = "c1"; // Demo: Alex Rivera

export default function CoachDashboard() {
  const myClients = getClientsByCoach(COACH_ID);
  const atRisk = getAtRiskClients(COACH_ID);
  const upcoming = getUpcomingBookings(COACH_ID);
  const activePlans = workoutPlans.filter((p) => p.coachId === COACH_ID && p.status === "active");
  const activeCount = myClients.filter((c) => c.status === "active").length;
  const todayBookings = bookings.filter(
    (b) => b.coachId === COACH_ID && b.startTime.startsWith("2026-03-18")
  );

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Dashboard" description="Welcome back, Alex.">
        <Link to="/clients">
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Add client
          </Button>
        </Link>
        <Link to="/training">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New plan
          </Button>
        </Link>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Active Clients" value={activeCount} change="+2 this month" changeType="positive" />
        <MetricCard label="Today's Sessions" value={todayBookings.length} />
        <MetricCard label="At Risk" value={atRisk.length} change="needs attention" changeType="negative" />
        <MetricCard label="Active Plans" value={activePlans.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Upcoming Sessions
            </h2>
            <Link to="/calendar" className="text-xs font-medium text-primary hover:underline">
              View all
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
                      {format(parseISO(booking.startTime), "EEE, MMM d · h:mm a")}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground capitalize">{booking.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* At Risk Clients */}
        <div className="rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Clients at Risk</h2>
            <Link to="/clients" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {atRisk.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No clients at risk. Nice work.</p>
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
                        Last active: {format(parseISO(client.lastActivity), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 text-xs font-medium text-primary transition-opacity">
                    Message
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Recent check-ins */}
          <div className="border-t border-border">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" /> Active Plans
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
                    <p className="text-xs text-muted-foreground">{plan.clientName} · {plan.exercises.length} exercises</p>
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
