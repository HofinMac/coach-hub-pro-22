import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { clients } from "@/lib/demo-data";
import { AvatarCircle } from "@/components/AvatarCircle";
import { toast } from "sonner";

const packages = [
  { id: 'pkg1', clientId: 'cl2', clientName: 'Elena Voss', name: 'Balíček 10 lekcí', credits: 8, total: 10, price: 950, status: 'active', expiresAt: '2026-06-15' },
  { id: 'pkg2', clientId: 'cl3', clientName: 'James Park', name: 'Měsíční koučink', credits: 12, total: 12, price: 400, status: 'active', expiresAt: '2026-04-20' },
  { id: 'pkg3', clientId: 'cl4', clientName: 'Sofia Reyes', name: 'Balíček 10 lekcí', credits: 6, total: 10, price: 950, status: 'active', expiresAt: '2026-05-01' },
  { id: 'pkg4', clientId: 'cl1', clientName: 'Marcus Aurelius', name: 'Balíček 10 lekcí', credits: 4, total: 10, price: 1200, status: 'active', expiresAt: '2026-04-10' },
  { id: 'pkg5', clientId: 'cl5', clientName: 'David Kim', name: 'Balíček 10 lekcí', credits: 2, total: 10, price: 1200, status: 'expiring', expiresAt: '2026-03-25' },
];

const invoices = [
  { id: 'inv1', client: 'Elena Voss', amount: 950, date: '2026-02-15', status: 'paid' },
  { id: 'inv2', client: 'James Park', amount: 400, date: '2026-03-01', status: 'paid' },
  { id: 'inv3', client: 'Sofia Reyes', amount: 950, date: '2026-01-20', status: 'paid' },
  { id: 'inv4', client: 'David Kim', amount: 1200, date: '2026-01-05', status: 'paid' },
  { id: 'inv5', client: 'Marcus Aurelius', amount: 1200, date: '2025-12-15', status: 'paid' },
  { id: 'inv6', client: 'Mia Santos', amount: 0, date: '2026-03-16', status: 'pending' },
];

export default function PaymentsPage() {
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [pkgClient, setPkgClient] = useState("");
  const [pkgName, setPkgName] = useState("Balíček 10 lekcí");
  const [pkgCredits, setPkgCredits] = useState("10");
  const [pkgPrice, setPkgPrice] = useState("");

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Platby" description="Balíčky a faktury">
        <Button size="sm" className="gap-1.5" onClick={() => setPkgOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Nový balíček
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl p-5 bg-card shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Celkové příjmy</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground mt-1">{totalRevenue.toLocaleString('cs-CZ')} Kč</p>
        </div>
        <div className="rounded-xl p-5 bg-card shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Aktivní balíčky</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground mt-1">{packages.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="rounded-xl p-5 bg-card shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Brzy vyprší</p>
          <p className="text-2xl font-semibold tabular-nums text-destructive mt-1">{packages.filter(p => p.status === 'expiring').length}</p>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Aktivní balíčky</h2>
      <div className="rounded-xl bg-card shadow-card overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Klient</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Balíček</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Kredity</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Vyprší</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {packages.map(pkg => {
              const c = clients.find(cl => cl.id === pkg.clientId);
              return (
                <tr key={pkg.id} className="hover:bg-subtle transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <AvatarCircle initials={c?.avatar || '?'} size="sm" />
                    <span className="text-sm font-medium text-foreground">{pkg.clientName}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{pkg.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono tabular-nums text-sm text-foreground">{pkg.credits}/{pkg.total}</span>
                  </td>
                  <td className={`px-4 py-3 text-right text-sm ${pkg.status === 'expiring' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {pkg.expiresAt}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Poslední faktury</h2>
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Klient</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Částka</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Datum</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Stav</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-subtle transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{inv.client}</td>
                <td className="px-4 py-3 text-right text-sm font-mono tabular-nums text-foreground">{inv.amount.toLocaleString('cs-CZ')} Kč</td>
                <td className="px-4 py-3 text-right text-sm text-muted-foreground">{inv.date}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    inv.status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>{inv.status === 'paid' ? 'Zaplaceno' : 'Čeká na platbu'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
