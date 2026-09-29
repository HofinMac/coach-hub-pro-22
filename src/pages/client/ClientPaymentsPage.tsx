import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { CreditCard, Package, Clock, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { Progress } from "@/components/ui/progress";
import { from, requireUserId, formatCzk, type ClientPackageRow, type PaymentRow, type PaymentStatus } from "@/lib/db";

const fmtDate = (d: string | null) => (d ? format(parseISO(d), "d. M. yyyy") : "—");
const todayStr = () => format(new Date(), "yyyy-MM-dd");
const isActive = (p: ClientPackageRow) => p.status === "active" && (!p.expires_at || p.expires_at >= todayStr());

const statusBadge: Record<PaymentStatus, { label: string; cls: string }> = {
  paid: { label: "zaplaceno", cls: "bg-success/10 text-success" },
  pending: { label: "čeká na platbu", cls: "bg-warning/10 text-warning" },
  cancelled: { label: "zrušeno", cls: "bg-muted text-muted-foreground" },
};

export default function ClientPaymentsPage() {
  const [packages, setPackages] = useState<ClientPackageRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const uid = await requireUserId();
        const [pkgRes, payRes] = await Promise.all([
          from("client_packages").select("*").eq("client_id", uid).order("created_at", { ascending: false }),
          from("payments").select("*").eq("client_id", uid).order("created_at", { ascending: false }),
        ]);
        if (pkgRes.error) throw pkgRes.error;
        if (payRes.error) throw payRes.error;
        if (cancelled) return;
        setPackages((pkgRes.data ?? []) as ClientPackageRow[]);
        setPayments((payRes.data ?? []) as PaymentRow[]);
      } catch (err) {
        console.error(err);
        toast.error("Nepodařilo se načíst platby");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activePackages = packages.filter(isActive);
  const remainingCredits = activePackages.reduce((s, p) => s + p.remaining_credits, 0);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount_czk, 0);
  const nextDue = payments
    .filter(p => p.status === "pending")
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))[0];

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Balíčky a platby" description="Přehled tvých kreditů a platební historie." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard label="Zbývající kredity" value={loading ? "…" : remainingCredits} icon={Package} />
        <MetricCard label="Celkem zaplaceno" value={loading ? "…" : formatCzk(totalPaid)} icon={CreditCard} />
        <MetricCard
          label="Další platba"
          value={loading ? "…" : nextDue ? (nextDue.due_date ? fmtDate(nextDue.due_date) : "Nezadáno") : "—"}
          change={nextDue ? formatCzk(nextDue.amount_czk) : undefined}
          icon={Clock}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-foreground mb-3">Moje balíčky</h2>
          {packages.length === 0 ? (
            <div className="rounded-xl bg-card shadow-card p-6 text-sm text-muted-foreground text-center mb-8">
              Zatím nemáš žádný balíček. Domluv se se svým trenérem.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {packages.map(p => {
                const active = isActive(p);
                return (
                  <div key={p.id} className={`rounded-xl bg-card shadow-card p-4 ${active ? "" : "opacity-60"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <span className="font-mono tabular-nums text-sm text-foreground shrink-0">
                        {p.remaining_credits}/{p.total_credits}
                      </span>
                    </div>
                    <Progress value={(p.remaining_credits / p.total_credits) * 100} className="h-1.5 mt-3" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {active
                        ? p.expires_at ? `Platí do ${fmtDate(p.expires_at)}` : "Bez omezení platnosti"
                        : p.status === "used" ? "Vyčerpán" : p.status === "cancelled" ? "Zrušen" : "Vypršel"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-xl bg-card shadow-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Historie plateb</h2>
            </div>
            {payments.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Zatím žádné platby.</p>
            ) : (
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
                  {payments.map(p => {
                    const badge = statusBadge[p.status];
                    return (
                      <tr key={p.id} className="hover:bg-subtle transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{p.description}</td>
                        <td className="px-4 py-3 text-sm font-mono tabular-nums text-foreground text-right whitespace-nowrap">
                          {formatCzk(p.amount_czk)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground text-right hidden sm:table-cell">
                          {fmtDate(p.status === "paid" ? p.paid_at : p.due_date ?? p.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
