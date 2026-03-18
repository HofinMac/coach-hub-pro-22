import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { clients } from "@/lib/demo-data";
import { CreditCard, Package, Clock } from "lucide-react";

const CLIENT_ID = "cl2";

const demoPayments = [
  { id: 1, description: "Balíček 10 lekcí", amount: 12000, date: "2026-02-01", status: "zaplaceno" },
  { id: 2, description: "Individuální lekce", amount: 1200, date: "2026-01-15", status: "zaplaceno" },
  { id: 3, description: "Balíček 10 lekcí", amount: 12000, date: "2025-12-01", status: "zaplaceno" },
];

export default function ClientPaymentsPage() {
  const client = clients.find(c => c.id === CLIENT_ID)!;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Balíčky a platby" description="Přehled tvých kreditů a platební historie." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard label="Zbývající kredity" value={client.packageCredits} />
        <MetricCard label="Celkem zaplaceno" value="25 200 Kč" />
        <MetricCard label="Další platba" value="1. 4. 2026" />
      </div>

      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Historie plateb</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Popis</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Částka</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Datum</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Stav</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {demoPayments.map(p => (
              <tr key={p.id} className="hover:bg-subtle transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{p.description}</td>
                <td className="px-4 py-3 text-sm font-mono tabular-nums text-foreground text-right">
                  {p.amount.toLocaleString("cs-CZ")} Kč
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground text-right hidden sm:table-cell">{p.date}</td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
