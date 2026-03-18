import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { coaches, clients } from "@/lib/demo-data";
import { Check, X } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Admin" description="Platform management" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Coaches" value={coaches.length} />
        <MetricCard label="Total Clients" value={clients.length} />
        <MetricCard label="Verified Coaches" value={coaches.filter(c => c.isVerified).length} />
        <MetricCard label="Pending Verification" value={coaches.filter(c => !c.isVerified).length} change="action needed" changeType="negative" />
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Coach Management</h2>
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Coach</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Specialties</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Clients</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Verified</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
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
                    <span className="inline-flex items-center text-xs font-medium text-success gap-1"><Check className="h-3.5 w-3.5" /> Verified</span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-warning gap-1"><X className="h-3.5 w-3.5" /> Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!coach.isVerified && (
                    <Button variant="outline" size="sm">Verify</Button>
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
