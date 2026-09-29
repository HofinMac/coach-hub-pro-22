import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { AvatarCircle } from "@/components/AvatarCircle";
import { supabase } from "@/integrations/supabase/client";
import { initialsOf } from "@/lib/db";
import { Building2, Gift, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";

const ROLE_LABELS: Record<string, string> = { coach: "Trenér", client: "Klient", admin: "Admin" };
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ");

export default function AdminPage() {
  // Admins can read all profiles via RLS.
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, assigned_coach_id, specialties, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const coaches = profiles.filter(p => p.role === "coach");
  const clients = profiles.filter(p => p.role === "client");
  const clientCounts = new Map<string, number>();
  clients.forEach(c => {
    if (c.assigned_coach_id) clientCounts.set(c.assigned_coach_id, (clientCounts.get(c.assigned_coach_id) ?? 0) + 1);
  });
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newSignups = profiles.filter(p => new Date(p.created_at).getTime() >= monthAgo).length;
  const unassigned = clients.filter(c => !c.assigned_coach_id).length;
  const sortedCoaches = [...coaches].sort((a, b) => (clientCounts.get(b.id) ?? 0) - (clientCounts.get(a.id) ?? 0));
  const show = (n: number) => (isLoading ? "–" : n);

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Administrace" description="Správa platformy" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Celkem trenérů" value={show(coaches.length)} />
        <MetricCard label="Celkem klientů" value={show(clients.length)} />
        <MetricCard label="Klienti bez trenéra" value={show(unassigned)} change={unassigned > 0 ? "vyžaduje akci" : undefined} changeType="negative" />
        <MetricCard label="Noví za 30 dní" value={show(newSignups)} />
      </div>

      {/* Partner module links */}
      <h2 className="text-sm font-semibold text-foreground mb-3">Partnerský modul</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/partners" className="rounded-xl bg-card shadow-card p-5 hover:bg-accent/50 transition-colors flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Partneři</p>
            <p className="text-xs text-muted-foreground">Správa partnerských značek</p>
          </div>
        </Link>
        <Link to="/admin/campaigns" className="rounded-xl bg-card shadow-card p-5 hover:bg-accent/50 transition-colors flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Promo akce</p>
            <p className="text-xs text-muted-foreground">Výzvy, slevy a benefity</p>
          </div>
        </Link>
        <Link to="/admin/approvals" className="rounded-xl bg-card shadow-card p-5 hover:bg-accent/50 transition-colors flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Schvalování</p>
            <p className="text-xs text-muted-foreground">Certifikáty a žádosti</p>
          </div>
        </Link>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Trenéři</h2>
      <div className="rounded-xl bg-card shadow-card overflow-x-auto mb-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Načítám…</p>
        ) : sortedCoaches.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Zatím žádní trenéři.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-subtle">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Trenér</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Specializace</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Klienti</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Registrace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedCoaches.map(coach => (
                <tr key={coach.id} className="hover:bg-subtle transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <AvatarCircle initials={initialsOf(coach.full_name)} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{coach.full_name || "Bez jména"}</p>
                      <p className="text-xs text-muted-foreground">{coach.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(coach.specialties ?? []).map(s => (
                        <span key={s} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-mono tabular-nums text-foreground">{clientCounts.get(coach.id) ?? 0}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">{formatDate(coach.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Nové registrace</h2>
      <div className="rounded-xl bg-card shadow-card divide-y divide-border">
        {isLoading ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Načítám…</p>
        ) : profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Zatím žádní uživatelé.</p>
        ) : (
          profiles.slice(0, 10).map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <AvatarCircle initials={initialsOf(p.full_name)} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{p.full_name || "Bez jména"}</p>
                <p className="text-xs text-muted-foreground truncate">{p.email}</p>
              </div>
              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-md">{ROLE_LABELS[p.role] ?? p.role}</span>
              <span className="text-xs text-muted-foreground w-20 text-right">{formatDate(p.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
