import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, Loader2, Plus, X } from "lucide-react";
import { AvatarCircle } from "@/components/AvatarCircle";
import { toast } from "sonner";
import {
  from, requireUserId, fetchCoachClients, initialsOf, formatCzk,
  type ClientPackageRow, type PaymentRow, type PaymentStatus, type ProfileRow,
} from "@/lib/db";

const todayStr = () => format(new Date(), "yyyy-MM-dd");
const fmtDate = (d: string | null) => (d ? format(parseISO(d), "d. M. yyyy") : "—");

const isExpired = (p: ClientPackageRow) => !!p.expires_at && p.expires_at < todayStr();
const isActive = (p: ClientPackageRow) => p.status === "active" && !isExpired(p);
const isExpiringSoon = (p: ClientPackageRow) =>
  isActive(p) &&
  ((!!p.expires_at && differenceInCalendarDays(parseISO(p.expires_at), new Date()) <= 14) || p.remaining_credits <= 2);

const packageStatusLabel = (p: ClientPackageRow) => {
  if (p.status === "active") return isExpired(p) ? "Vypršel" : "Aktivní";
  return { used: "Vyčerpán", expired: "Vypršel", cancelled: "Zrušen" }[p.status];
};

const paymentBadge: Record<PaymentStatus, { label: string; cls: string }> = {
  paid: { label: "Zaplaceno", cls: "bg-success/10 text-success" },
  pending: { label: "Čeká na platbu", cls: "bg-warning/10 text-warning" },
  cancelled: { label: "Zrušeno", cls: "bg-muted text-muted-foreground" },
};

const defaultForm = () => ({
  client: "", name: "Balíček 10 lekcí", credits: "10", price: "",
  expiresAt: format(addDays(new Date(), 90), "yyyy-MM-dd"),
  paid: true, dueDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
});

export default function PaymentsPage() {
  const [coachId, setCoachId] = useState<string | null>(null);
  const [clients, setClients] = useState<ProfileRow[]>([]);
  const [packages, setPackages] = useState<ClientPackageRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [busyPayment, setBusyPayment] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const uid = await requireUserId();
      const [clientRows, pkgRes, payRes] = await Promise.all([
        fetchCoachClients(uid),
        from("client_packages").select("*").eq("coach_id", uid).order("created_at", { ascending: false }),
        from("payments").select("*").eq("coach_id", uid).order("created_at", { ascending: false }),
      ]);
      if (pkgRes.error) throw pkgRes.error;
      if (payRes.error) throw payRes.error;
      setCoachId(uid);
      setClients(clientRows);
      setPackages((pkgRes.data ?? []) as ClientPackageRow[]);
      setPayments((payRes.data ?? []) as PaymentRow[]);
    } catch (err) {
      console.error(err);
      toast.error("Nepodařilo se načíst platby");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const clientName = (id: string) => clientMap.get(id)?.full_name ?? "Bývalý klient";

  const totalRevenue = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount_czk, 0);
  const activeCount = packages.filter(isActive).length;
  const expiringCount = packages.filter(isExpiringSoon).length;
  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => Number(isActive(b)) - Number(isActive(a))),
    [packages],
  );

  const handleCreate = async () => {
    const credits = parseInt(form.credits, 10);
    const price = parseInt(form.price, 10);
    if (!form.client || form.price === "" || Number.isNaN(price) || price < 0) { toast.error("Vyplňte klienta a cenu"); return; }
    if (!form.name.trim()) { toast.error("Zadejte název balíčku"); return; }
    if (!credits || credits < 1) { toast.error("Počet kreditů musí být alespoň 1"); return; }
    if (!coachId) return;
    setSaving(true);
    try {
      const { data: pkg, error } = await from("client_packages")
        .insert({
          coach_id: coachId, client_id: form.client, name: form.name.trim(),
          total_credits: credits, remaining_credits: credits, price_czk: price,
          expires_at: form.expiresAt || null,
        })
        .select()
        .single();
      if (error) throw error;
      const { error: payErr } = await from("payments").insert({
        coach_id: coachId, client_id: form.client, package_id: (pkg as ClientPackageRow).id,
        description: form.name.trim(), amount_czk: price,
        status: form.paid ? "paid" : "pending",
        paid_at: form.paid ? new Date().toISOString() : null,
        due_date: form.paid ? null : form.dueDate || null,
      });
      if (payErr) throw payErr;
      toast.success("Balíček vytvořen");
      setPkgOpen(false);
      setForm(defaultForm());
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Balíček se nepodařilo vytvořit");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const updatePayment = async (id: string, status: PaymentStatus) => {
    setBusyPayment(id);
    const patch = { status, paid_at: status === "paid" ? new Date().toISOString() : null };
    const { error } = await from("payments").update(patch).eq("id", id);
    setBusyPayment(null);
    if (error) { console.error(error); toast.error("Platbu se nepodařilo upravit"); return; }
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
    toast.success(status === "paid" ? "Platba označena jako zaplacená" : "Platba zrušena");
  };

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
          <p className="text-2xl font-semibold tabular-nums text-foreground mt-1">{formatCzk(totalRevenue)}</p>
        </div>
        <div className="rounded-xl p-5 bg-card shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Aktivní balíčky</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl p-5 bg-card shadow-card">
          <p className="text-sm font-medium text-muted-foreground">Brzy vyprší</p>
          <p className="text-2xl font-semibold tabular-nums text-destructive mt-1">{expiringCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-foreground mb-3">Balíčky</h2>
          <div className="rounded-xl bg-card shadow-card overflow-x-auto mb-8">
            {sortedPackages.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Zatím žádné balíčky. Vytvořte první přes „Nový balíček“.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-subtle">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Klient</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Balíček</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Kredity</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Stav</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Vyprší</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedPackages.map(pkg => {
                    const active = isActive(pkg);
                    const soon = isExpiringSoon(pkg);
                    const name = clientName(pkg.client_id);
                    return (
                      <tr key={pkg.id} className={`hover:bg-subtle transition-colors ${active ? '' : 'opacity-60'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AvatarCircle initials={initialsOf(name)} size="sm" />
                            <span className="text-sm font-medium text-foreground">{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{pkg.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-mono tabular-nums text-sm ${active && pkg.remaining_credits <= 2 ? 'text-destructive font-medium' : 'text-foreground'}`}>
                            {pkg.remaining_credits}/{pkg.total_credits}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">{packageStatusLabel(pkg)}</td>
                        <td className={`px-4 py-3 text-right text-sm ${soon ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {fmtDate(pkg.expires_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <h2 className="text-sm font-semibold text-foreground mb-3">Poslední platby</h2>
          <div className="rounded-xl bg-card shadow-card overflow-x-auto">
            {payments.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Zatím žádné platby.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-subtle">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Klient</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Popis</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Částka</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Datum</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Stav</th>
                    <th className="px-4 py-3 w-px" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map(pay => {
                    const badge = paymentBadge[pay.status];
                    const date = pay.status === "paid" ? pay.paid_at : pay.due_date;
                    return (
                      <tr key={pay.id} className="hover:bg-subtle transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{clientName(pay.client_id)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{pay.description}</td>
                        <td className="px-4 py-3 text-right text-sm font-mono tabular-nums text-foreground whitespace-nowrap">{formatCzk(pay.amount_czk)}</td>
                        <td className="px-4 py-3 text-right text-sm text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                          {pay.status === "pending" && pay.due_date ? `splatnost ${fmtDate(pay.due_date)}` : fmtDate(date ?? pay.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md whitespace-nowrap ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          {pay.status === "pending" && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon" variant="ghost" className="h-7 w-7 text-success"
                                title="Označit jako zaplaceno" disabled={busyPayment === pay.id}
                                onClick={() => updatePayment(pay.id, "paid")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground"
                                title="Zrušit platbu" disabled={busyPayment === pay.id}
                                onClick={() => updatePayment(pay.id, "cancelled")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
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

      {/* New Package Dialog */}
      <Dialog open={pkgOpen} onOpenChange={setPkgOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nový balíček</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Klient</Label>
              <Select value={form.client} onValueChange={v => setForm(f => ({ ...f, client: v }))}>
                <SelectTrigger><SelectValue placeholder={clients.length ? "Vyberte klienta" : "Zatím nemáte žádné klienty"} /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Název balíčku</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Počet kreditů</Label>
                <Input type="number" min={1} value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Cena (Kč)</Label>
                <Input type="number" min={0} placeholder="950" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Platnost do</Label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.paid} onCheckedChange={v => setForm(f => ({ ...f, paid: v === true }))} />
              <span className="text-sm">Zaplaceno</span>
            </label>
            {!form.paid && (
              <div className="space-y-1.5">
                <Label>Splatnost</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPkgOpen(false)}>Zrušit</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Vytvořit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
