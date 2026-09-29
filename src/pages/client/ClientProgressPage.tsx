import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { Loader2, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { from, requireUserId, type ProgressEntryRow } from "@/lib/db";

const COLUMNS = "id, client_id, logged_at, weight, body_fat, notes, created_by";

const parseNum = (v: string) => (v.trim() ? Number(v.replace(",", ".")) : null);

// Postgres numeric may arrive as a string; normalise.
const normalise = (row: ProgressEntryRow): ProgressEntryRow => ({
  ...row,
  weight: row.weight == null ? null : Number(row.weight),
  body_fat: row.body_fat == null ? null : Number(row.body_fat),
});

export default function ClientProgressPage() {
  const [entries, setEntries] = useState<ProgressEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const uid = await requireUserId();
      const { data, error } = await from("progress_entries")
        .select(COLUMNS)
        .eq("client_id", uid)
        .order("logged_at", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      setEntries(((data ?? []) as ProgressEntryRow[]).map(normalise));
    } catch (err) {
      console.error(err);
      toast.error("Měření se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDialog = () => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    const lastWeight = [...entries].reverse().find(e => e.weight != null)?.weight;
    setWeight(lastWeight != null ? String(lastWeight) : "");
    setBodyFat("");
    setNotes("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const w = parseNum(weight);
    const bf = parseNum(bodyFat);
    if (!date) { toast.error("Vyber datum měření."); return; }
    if (w === null && bf === null) { toast.error("Vyplň alespoň váhu nebo podíl tuku."); return; }
    if (w !== null && (!Number.isFinite(w) || w <= 0 || w > 500)) { toast.error("Zadej platnou váhu v kg."); return; }
    if (bf !== null && (!Number.isFinite(bf) || bf < 0 || bf > 100)) { toast.error("Podíl tuku musí být 0–100 %."); return; }
    setSaving(true);
    try {
      const uid = await requireUserId();
      const { data, error } = await from("progress_entries")
        .insert({ client_id: uid, logged_at: date, weight: w, body_fat: bf, notes: notes.trim() })
        .select(COLUMNS)
        .single();
      if (error) throw error;
      const row = normalise(data as ProgressEntryRow);
      setEntries(prev => [...prev, row].sort((a, b) => a.logged_at.localeCompare(b.logged_at)));
      toast.success("Měření uloženo!");
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Měření se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  };

  const weighed = entries.filter((e): e is ProgressEntryRow & { weight: number } => e.weight != null);
  const chartData = weighed.map(p => ({
    date: format(parseISO(p.logged_at), "d. MMM", { locale: cs }),
    weight: p.weight,
  }));
  const first = weighed[0];
  const last = weighed[weighed.length - 1];
  const weightDiff = weighed.length > 1 ? Number((last.weight - first.weight).toFixed(1)) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Sledování pokroku" description="Tvoje měření a vývoj.">
        <Button size="sm" className="gap-1.5" onClick={openDialog} disabled={loading}>
          <Plus className="h-3.5 w-3.5" /> Přidat měření
        </Button>
      </PageHeader>

      {loading ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Načítám…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-xl bg-card shadow-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">Zatím žádné měření</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Zapiš si váhu a podíl tuku a sleduj, jak se měníš.</p>
          <Button size="sm" className="gap-1.5" onClick={openDialog}>
            <Plus className="h-3.5 w-3.5" /> Přidat první měření
          </Button>
        </div>
      ) : (
        <>
          {weightDiff !== null && (
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-card shadow-card">
              {weightDiff < 0 ? (
                <TrendingDown className="h-5 w-5 text-success" />
              ) : (
                <TrendingUp className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {weightDiff > 0 ? "+" : ""}{weightDiff.toLocaleString("cs-CZ")} kg od začátku
                </p>
                <p className="text-xs text-muted-foreground">
                  {first.weight.toLocaleString("cs-CZ")} kg → {last.weight.toLocaleString("cs-CZ")} kg
                </p>
              </div>
            </div>
          )}

          {chartData.length > 1 && (
            <div className="rounded-xl bg-card shadow-card p-4 mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Vývoj hmotnosti</h2>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`${v.toLocaleString("cs-CZ")} kg`, "Váha"]}
                    />
                    <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Váha (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-card shadow-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Všechny záznamy</h2>
            </div>
            <div className="divide-y divide-border">
              {entries.slice().reverse().map((entry) => (
                <div key={entry.id} className="p-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {entry.weight != null && (
                        <span className="text-sm font-mono font-medium text-foreground tabular-nums">
                          {entry.weight.toLocaleString("cs-CZ")} kg
                        </span>
                      )}
                      {entry.body_fat != null && (
                        <span className="text-xs text-muted-foreground">{entry.body_fat.toLocaleString("cs-CZ")} % tuk</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(entry.logged_at), "d. MMMM yyyy", { locale: cs })}
                    </span>
                  </div>
                  {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !saving && setDialogOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Přidat měření</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="pe-date" className="text-xs">Datum</Label>
              <Input
                id="pe-date" type="date" value={date} max={format(new Date(), "yyyy-MM-dd")}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="pe-weight" className="text-xs">Váha (kg)</Label>
                <Input
                  id="pe-weight" type="number" inputMode="decimal" min={0} step={0.1} placeholder="např. 72,5"
                  value={weight} onChange={e => setWeight(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pe-fat" className="text-xs">Podíl tuku (%)</Label>
                <Input
                  id="pe-fat" type="number" inputMode="decimal" min={0} max={100} step={0.1} placeholder="nepovinné"
                  value={bodyFat} onChange={e => setBodyFat(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pe-notes" className="text-xs">Poznámka</Label>
              <Textarea
                id="pe-notes" rows={2} placeholder="např. ráno nalačno"
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Zrušit</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Uložit měření
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
