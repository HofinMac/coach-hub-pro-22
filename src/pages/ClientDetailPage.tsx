import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { AvatarCircle } from "@/components/AvatarCircle";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Mail, Edit, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ClientStatus } from "@/lib/domain";
import {
  from,
  requireUserId,
  initialsOf,
  type ProfileRow,
  type ClientIntakeRow,
  type CoachClientRecordRow,
  type ProgressEntryRow,
  type WorkoutPlanRow,
  type ClientPackageRow,
} from "@/lib/db";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const statusOptions: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Aktivní" },
  { value: "at_risk", label: "V ohrožení" },
  { value: "lead", label: "Potenciální" },
  { value: "inactive", label: "Neaktivní" },
];

const experienceLabels: Record<string, string> = {
  none: "Žádné",
  beginner: "Začátečník",
  intermediate: "Středně pokročilý",
  advanced: "Pokročilý",
};
const genderLabels: Record<string, string> = { male: "Muž", female: "Žena", other: "Jiné" };
const activityLabels: Record<string, string> = {
  none: "Žádná",
  "1-2": "1–2× týdně",
  "3-4": "3–4× týdně",
  "5+": "5× a více týdně",
};
const timeLabels: Record<string, string> = {
  morning: "ráno",
  midday: "dopoledne",
  afternoon: "odpoledne",
  evening: "večer",
  flexible: "flexibilně",
};

const formatDate = (value: string) => format(parseISO(value), "d. M. yyyy", { locale: cs });

/** Accepts "75,5" as well as "75.5"; empty input → null. */
const parseDecimal = (value: string): number | null => {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
};

async function loadClientDetail(clientId: string) {
  const coachId = await requireUserId();
  const [profileRes, intakeRes, recordRes, progressRes, plansRes, packagesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, profile_photo_url, role, assigned_coach_id, created_at")
      .eq("id", clientId)
      .maybeSingle(),
    from("client_intake").select("*").eq("client_id", clientId).maybeSingle(),
    from("coach_client_records").select("*").eq("coach_id", coachId).eq("client_id", clientId).maybeSingle(),
    from("progress_entries").select("*").eq("client_id", clientId).order("logged_at").order("created_at"),
    from("workout_plans").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    from("client_packages").select("*").eq("client_id", clientId).eq("status", "active"),
  ]);
  for (const res of [profileRes, intakeRes, recordRes, progressRes, plansRes, packagesRes]) {
    if (res.error) throw res.error;
  }
  return {
    coachId,
    profile: (profileRes.data ?? null) as ProfileRow | null,
    intake: (intakeRes.data ?? null) as ClientIntakeRow | null,
    record: (recordRes.data ?? null) as CoachClientRecordRow | null,
    progress: (progressRes.data ?? []) as ProgressEntryRow[],
    plans: (plansRes.data ?? []) as WorkoutPlanRow[],
    packages: (packagesRes.data ?? []) as ClientPackageRow[],
  };
}

export default function ClientDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-detail", id],
    queryFn: () => loadClientDetail(id),
    enabled: !!id,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<ClientStatus>("active");
  const [editTags, setEditTags] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [measureOpen, setMeasureOpen] = useState(false);
  const [measureDate, setMeasureDate] = useState("");
  const [measureWeight, setMeasureWeight] = useState("");
  const [measureFat, setMeasureFat] = useState("");
  const [measureNote, setMeasureNote] = useState("");

  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["client-detail", id] });

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-sm text-muted-foreground">Načítám klienta…</p>
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-muted-foreground">{isError ? "Klienta se nepodařilo načíst." : "Klient nenalezen."}</p>
        <Link to="/clients" className="text-primary text-sm hover:underline">← Zpět na klienty</Link>
      </div>
    );
  }

  const { coachId, profile: client, intake, record, progress, plans, packages } = data;
  const status: ClientStatus = record?.status ?? "active";
  const tags = record?.tags ?? [];
  const today = format(new Date(), "yyyy-MM-dd");
  const remainingCredits = packages
    .filter(p => !p.expires_at || p.expires_at >= today)
    .reduce((sum, p) => sum + p.remaining_credits, 0);

  const latestWeight = [...progress].reverse().find(p => p.weight != null)?.weight;
  const latestFat = [...progress].reverse().find(p => p.body_fat != null)?.body_fat;
  const chartData = progress
    .filter(p => p.weight != null)
    .map(p => ({ date: p.logged_at, weight: Number(p.weight) }));

  const goals = [intake?.goals.join(", "), intake?.goal_detail].filter(Boolean).join(" – ");
  const injuryList = (intake?.injuries ?? []).filter(i => i !== "Žádná zranění");
  const injuries = [injuryList.join(", "), intake?.injury_detail].filter(Boolean).join(" – ");
  const preference = [
    intake?.preferred_days ? `${intake.preferred_days}× týdně` : "",
    intake?.preferred_time ? timeLabels[intake.preferred_time] ?? intake.preferred_time : "",
  ].filter(Boolean).join(", ");

  const openEdit = () => {
    setEditStatus(status);
    setEditTags(tags.join(", "));
    setEditNotes(record?.notes ?? "");
    setEditOpen(true);
  };

  const openMeasure = () => {
    setMeasureDate(today);
    setMeasureWeight("");
    setMeasureFat("");
    setMeasureNote("");
    setMeasureOpen(true);
  };

  const handleSaveRecord = async () => {
    setSaving(true);
    const { error } = await from("coach_client_records").upsert(
      {
        coach_id: coachId,
        client_id: client.id,
        status: editStatus,
        tags: [...new Set(editTags.split(",").map(t => t.trim()).filter(Boolean))],
        notes: editNotes.trim(),
      },
      { onConflict: "coach_id,client_id" },
    );
    setSaving(false);
    if (error) {
      toast.error("Chyba: " + error.message);
      return;
    }
    toast.success("Klient upraven");
    setEditOpen(false);
    refresh();
  };

  const handleAddMeasurement = async () => {
    const weight = parseDecimal(measureWeight);
    const bodyFat = parseDecimal(measureFat);
    if (Number.isNaN(weight) || (weight !== null && weight <= 0)) {
      toast.error("Zadejte platnou hmotnost");
      return;
    }
    if (Number.isNaN(bodyFat) || (bodyFat !== null && (bodyFat < 0 || bodyFat > 100))) {
      toast.error("Tělesný tuk musí být mezi 0 a 100 %");
      return;
    }
    if (weight === null && bodyFat === null && !measureNote.trim()) {
      toast.error("Vyplňte alespoň jednu hodnotu");
      return;
    }
    setSaving(true);
    const { error } = await from("progress_entries").insert({
      client_id: client.id,
      logged_at: measureDate || today,
      weight,
      body_fat: bodyFat,
      notes: measureNote.trim(),
    });
    setSaving(false);
    if (error) {
      toast.error("Chyba: " + error.message);
      return;
    }
    toast.success("Měření přidáno");
    setMeasureOpen(false);
    refresh();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Klienti
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {client.profile_photo_url ? (
            <img src={client.profile_photo_url} alt={client.full_name} className="h-12 w-12 rounded-full object-cover shrink-0" />
          ) : (
            <AvatarCircle initials={initialsOf(client.full_name)} size="lg" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{client.full_name || client.email}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/messages?client=${client.id}`)}>
            <Mail className="h-3.5 w-3.5" /> Zpráva
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={openMeasure}>
            <Plus className="h-3.5 w-3.5" /> Přidat měření
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={openEdit}>
            <Edit className="h-3.5 w-3.5" /> Upravit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl bg-card shadow-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Detaily</h3>
            <InfoRow label="Cíle" value={goals || "Neuvedeno"} />
            <InfoRow label="Zranění" value={injuries || "Žádná"} />
            <InfoRow label="Kredity balíčku" value={packages.length > 0 ? String(remainingCredits) : "Žádný aktivní balíček"} />
            <InfoRow label="Registrace" value={formatDate(client.created_at)} />
            {client.phone && <InfoRow label="Telefon" value={client.phone} />}
            {intake?.age != null && <InfoRow label="Věk" value={`${intake.age} let`} />}
            {intake?.gender && <InfoRow label="Pohlaví" value={genderLabels[intake.gender] ?? intake.gender} />}
            {intake?.height_cm != null && <InfoRow label="Výška" value={`${intake.height_cm} cm`} />}
            {latestWeight != null && <InfoRow label="Hmotnost" value={`${latestWeight} kg`} />}
            {latestFat != null && <InfoRow label="Tělesný tuk" value={`${latestFat} %`} />}
            {intake?.experience && <InfoRow label="Zkušenosti" value={experienceLabels[intake.experience] ?? intake.experience} />}
            {intake?.current_activity && (
              <InfoRow label="Současná aktivita" value={activityLabels[intake.current_activity] ?? intake.current_activity} />
            )}
            {preference && <InfoRow label="Preferované tréninky" value={preference} />}
          </div>

          <div className="rounded-xl bg-card shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Štítky</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Žádné štítky.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {record?.notes && (
            <div className="rounded-xl bg-card shadow-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">Soukromé poznámky</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {chartData.length > 1 && (
            <div className="rounded-xl bg-card shadow-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Vývoj hmotnosti</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(250, 89%, 60%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(250, 89%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" width={40} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.1)", fontSize: 13 }}
                    labelFormatter={(v) => formatDate(String(v))}
                    formatter={(v) => [`${v} kg`, "Hmotnost"]}
                  />
                  <Area type="monotone" dataKey="weight" stroke="hsl(250, 89%, 60%)" fill="url(#weightGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-xl bg-card shadow-card">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Tréninkové plány</h3>
            </div>
            {plans.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Žádné přiřazené plány.</p>
            ) : (
              <div className="divide-y divide-border">
                {plans.map((plan) => {
                  const planExercises = Array.isArray(plan.exercises) ? plan.exercises : [];
                  return (
                    <div key={plan.id} className="p-4 hover:bg-subtle transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{plan.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {planExercises.length} cviků · Vytvořeno {formatDate(plan.created_at)}
                          </p>
                        </div>
                        <StatusBadge status={plan.status} />
                      </div>
                      {planExercises.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {planExercises.map((ex, i) => (
                            <span key={`${ex.exerciseId}-${i}`} className="text-xs bg-muted rounded-md px-2 py-1 font-mono text-muted-foreground">
                              {ex.exerciseName} · {ex.sets}×{ex.reps} · RPE {ex.rpe}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-card shadow-card">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Záznam pokroku</h3>
              <button onClick={openMeasure} className="text-xs font-medium text-primary hover:underline">
                Přidat měření
              </button>
            </div>
            {progress.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Zatím žádná měření.</p>
            ) : (
              <div className="divide-y divide-border">
                {[...progress].reverse().map((entry) => (
                  <div key={entry.id} className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-foreground">{entry.notes || "Měření"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.logged_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {entry.weight != null && (
                        <p className="text-sm font-mono tabular-nums text-foreground">{entry.weight} kg</p>
                      )}
                      {entry.body_fat != null && (
                        <p className="text-xs font-mono tabular-nums text-muted-foreground">{entry.body_fat}% TT</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upravit klienta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Stav</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ClientStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Štítky</Label>
              <Input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="např. hubnutí, ranní, VIP" />
              <p className="text-xs text-muted-foreground">Oddělte čárkou.</p>
            </div>
            <div className="grid gap-1.5">
              <Label>Soukromé poznámky</Label>
              <Textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Poznámky vidíte jen vy."
                className="min-h-[100px]"
                maxLength={4000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Zrušit</Button>
            <Button onClick={handleSaveRecord} disabled={saving}>{saving ? "Ukládám..." : "Uložit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={measureOpen} onOpenChange={setMeasureOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Přidat měření</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Datum</Label>
              <Input type="date" value={measureDate} max={today} onChange={e => setMeasureDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Hmotnost (kg)</Label>
                <Input inputMode="decimal" value={measureWeight} onChange={e => setMeasureWeight(e.target.value)} placeholder="75,5" />
              </div>
              <div className="grid gap-1.5">
                <Label>Tělesný tuk (%)</Label>
                <Input inputMode="decimal" value={measureFat} onChange={e => setMeasureFat(e.target.value)} placeholder="18" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Poznámka</Label>
              <Textarea value={measureNote} onChange={e => setMeasureNote(e.target.value)} placeholder="Např. ranní měření nalačno" maxLength={500} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeasureOpen(false)}>Zrušit</Button>
            <Button onClick={handleAddMeasurement} disabled={saving}>{saving ? "Ukládám..." : "Uložit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
