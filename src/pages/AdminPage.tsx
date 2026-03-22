import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { coaches, clients } from "@/lib/demo-data";
import { Check, X, Building2, Gift, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Administrace" description="Správa platformy" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Celkem trenérů" value={coaches.length} />
        <MetricCard label="Celkem klientů" value={clients.length} />
        <MetricCard label="Ověření trenéři" value={coaches.filter(c => c.isVerified).length} />
        <MetricCard label="Čeká na ověření" value={coaches.filter(c => !c.isVerified).length} change="vyžaduje akci" changeType="negative" />
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

      <h2 className="text-sm font-semibold text-foreground mb-3">Správa trenérů</h2>
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Trenér</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Specializace</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Klienti</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Ověřen</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coaches.map(coach => (
              <tr key={coach.id} className="hover:bg-subtle transition-colors">
                <td className="px-4 py-3 flex items-center gap-3">
                  <AvatarCircle initials={coach.avatar} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{coach.name}</p>
                    <p className="text-xs text-muted-foreground">{coach.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {coach.specialties.map(s => (
                      <span key={s} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-md">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-sm font-mono tabular-nums text-foreground">{coach.clientCount}</td>
                <td className="px-4 py-3 text-center">
                  {coach.isVerified ? (
                    <span className="inline-flex items-center text-xs font-medium text-green-600 gap-1"><Check className="h-3.5 w-3.5" /> Ověřen</span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-yellow-600 gap-1"><X className="h-3.5 w-3.5" /> Čeká</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!coach.isVerified && (
                    <Button variant="outline" size="sm">Ověřit</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
