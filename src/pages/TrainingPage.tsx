import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Copy, Trash2, Video, ExternalLink, Search, Camera, Upload, X, MoreHorizontal, ClipboardList } from "lucide-react";
import { exercises as defaultExercises, type Exercise, type ExerciseCategory, type PlanExercise, type PlanStatus } from "@/lib/domain";
import { planTemplates } from "@/lib/plan-templates";
import { StatusBadge } from "@/components/StatusBadge";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PlanEditorDialog, { type PlanEditorData } from "@/components/PlanEditorDialog";
import { from, requireUserId, fetchCoachClients, type WorkoutPlanRow, type CoachExerciseRow } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const categoryLabels: Record<ExerciseCategory, string> = {
  knee_dominant: "Dominance kolene",
  hip_dominant: "Dominance kyčle",
  push: "Tlak",
  pull: "Tah",
  core: "Střed těla",
  conditioning: "Kondice",
  mobility: "Mobilita",
};

const tabLabels = { plans: 'Plány', exercises: 'Cviky' };

const planStatusLabels: Record<PlanStatus, string> = {
  draft: "Koncept",
  active: "Aktivní",
  completed: "Dokončený",
};

const rowToExercise = (r: CoachExerciseRow): Exercise => ({
  id: r.id,
  name: r.name,
  category: r.category,
  defaultNotes: r.default_notes,
  videoUrl: r.video_url ?? undefined,
});

const PLAN_COLUMNS = "id, coach_id, client_id, title, description, status, exercises, completed_at, created_at, updated_at";

/** Plan being edited/created in the editor dialog. */
interface PlanDraft {
  id: string | null;
  title: string;
  description: string;
  clientId: string | null;
  status: PlanStatus;
  exercises: PlanExercise[];
}

export default function TrainingPage() {
  const [tab, setTab] = useState<'plans' | 'exercises'>('plans');
  const [plans, setPlans] = useState<WorkoutPlanRow[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [clientList, setClientList] = useState<{ id: string; name: string }[]>([]);
  const [deletingPlan, setDeletingPlan] = useState<WorkoutPlanRow | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const exerciseList = [...defaultExercises, ...customExercises];
  const customExerciseIds = new Set(customExercises.map(e => e.id));
  const [savingExercise, setSavingExercise] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Plan editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingPlan, setEditingPlan] = useState<PlanDraft | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // Exercise editor state
  const [exerciseEditorOpen, setExerciseEditorOpen] = useState(false);
  const [exerciseEditorMode, setExerciseEditorMode] = useState<"create" | "edit">("create");
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exName, setExName] = useState("");
  const [exCategory, setExCategory] = useState<ExerciseCategory>("knee_dominant");
  const [exNotes, setExNotes] = useState("");
  const [exVideoUrl, setExVideoUrl] = useState("");
  const [exVideoFile, setExVideoFile] = useState<string | null>(null); // object URL preview of recorded/uploaded video
  const [exVideoBlob, setExVideoBlob] = useState<File | null>(null);
  const [videoInputMode, setVideoInputMode] = useState<"url" | "upload">("url");
  const videoFileRef = useRef<HTMLInputElement>(null);
  const videoCaptureRef = useRef<HTMLInputElement>(null);

  // Video preview state
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoPreviewName, setVideoPreviewName] = useState("");

  // --- Plan data ---
  const loadPlans = useCallback(async () => {
    try {
      const uid = await requireUserId();
      setCoachId(uid);
      const [plansRes, clients, exercisesRes] = await Promise.all([
        from("workout_plans").select(PLAN_COLUMNS).eq("coach_id", uid).order("created_at", { ascending: false }),
        fetchCoachClients(uid),
        from("coach_exercises").select("id, coach_id, name, category, default_notes, video_url").eq("coach_id", uid).order("name"),
      ]);
      if (plansRes.error) throw plansRes.error;
      if (exercisesRes.error) console.error(exercisesRes.error);
      setCustomExercises(((exercisesRes.data ?? []) as CoachExerciseRow[]).map(rowToExercise));
      setPlans((plansRes.data ?? []) as WorkoutPlanRow[]);
      setClientList(clients.map(c => ({ id: c.id, name: c.full_name || c.email })));
    } catch (err) {
      console.error(err);
      toast.error("Plány se nepodařilo načíst.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const clientNameOf = (id: string | null) =>
    id ? clientList.find(c => c.id === id)?.name ?? "Neznámý klient" : null;

  const completedAtFor = (status: PlanStatus, prev?: string | null) =>
    status === "completed" ? prev ?? new Date().toISOString() : null;

  // --- Plan handlers ---
  const openEditor = (mode: "create" | "edit", draft: PlanDraft) => {
    setEditorMode(mode);
    setEditingPlan(draft);
    setEditorKey(k => k + 1);
    setEditorOpen(true);
  };

  const handleNewPlan = () => setTemplatePickerOpen(true);

  const handleSelectTemplate = (templateExercises: PlanExercise[], templateName = "", templateDescription = "") => {
    setTemplatePickerOpen(false);
    openEditor("create", {
      id: null, title: templateName, description: templateDescription, clientId: null,
      status: "draft", exercises: templateExercises.map(e => ({ ...e })),
    });
  };

  const handleStartBlank = () => handleSelectTemplate([]);

  const handleEditPlan = (plan: WorkoutPlanRow) => {
    openEditor("edit", {
      id: plan.id, title: plan.title, description: plan.description, clientId: plan.client_id,
      status: plan.status, exercises: plan.exercises ?? [],
    });
  };

  const handleSave = async (data: PlanEditorData): Promise<boolean> => {
    if (!coachId) return false;
    const fields = {
      title: data.title,
      description: data.description,
      client_id: data.clientId,
      status: data.status,
      exercises: data.exercises,
    };
    if (editorMode === "create" || !editingPlan?.id) {
      const { data: row, error } = await from("workout_plans")
        .insert({ ...fields, coach_id: coachId, completed_at: completedAtFor(data.status) })
        .select(PLAN_COLUMNS)
        .single();
      if (error) { console.error(error); toast.error("Plán se nepodařilo vytvořit."); return false; }
      setPlans(prev => [row as WorkoutPlanRow, ...prev]);
      toast.success("Plán vytvořen!");
    } else {
      const prevPlan = plans.find(p => p.id === editingPlan.id);
      const { data: row, error } = await from("workout_plans")
        .update({ ...fields, completed_at: completedAtFor(data.status, prevPlan?.completed_at) })
        .eq("id", editingPlan.id)
        .select(PLAN_COLUMNS)
        .single();
      if (error) { console.error(error); toast.error("Změny se nepodařilo uložit."); return false; }
      setPlans(prev => prev.map(p => (p.id === editingPlan.id ? (row as WorkoutPlanRow) : p)));
      toast.success("Plán aktualizován!");
    }
    return true;
  };

  const handleDuplicatePlan = async (plan: WorkoutPlanRow) => {
    if (!coachId) return;
    const { data: row, error } = await from("workout_plans")
      .insert({
        coach_id: coachId,
        client_id: plan.client_id,
        title: `${plan.title} (kopie)`,
        description: plan.description,
        status: "draft",
        exercises: plan.exercises ?? [],
      })
      .select(PLAN_COLUMNS)
      .single();
    if (error) { console.error(error); toast.error("Plán se nepodařilo zkopírovat."); return; }
    setPlans(prev => [row as WorkoutPlanRow, ...prev]);
    toast.success("Kopie plánu vytvořena jako koncept.");
  };

  const handleStatusChange = async (plan: WorkoutPlanRow, status: PlanStatus) => {
    if (plan.status === status) return;
    const { data: row, error } = await from("workout_plans")
      .update({ status, completed_at: completedAtFor(status, plan.completed_at) })
      .eq("id", plan.id)
      .select(PLAN_COLUMNS)
      .single();
    if (error) { console.error(error); toast.error("Stav se nepodařilo změnit."); return; }
    setPlans(prev => prev.map(p => (p.id === plan.id ? (row as WorkoutPlanRow) : p)));
    toast.success(`Stav změněn: ${planStatusLabels[status]}`);
  };

  const handleDeletePlan = async () => {
    const plan = deletingPlan;
    if (!plan) return;
    setDeletingPlan(null);
    const { error } = await from("workout_plans").delete().eq("id", plan.id);
    if (error) { console.error(error); toast.error("Plán se nepodařilo smazat."); return; }
    setPlans(prev => prev.filter(p => p.id !== plan.id));
    toast.success("Plán smazán");
  };

  // --- Exercise handlers ---
  const openNewExercise = () => {
    setExerciseEditorMode("create");
    setEditingExercise(null);
    setExName("");
    setExCategory("knee_dominant");
    setExNotes("");
    setExVideoUrl("");
    setExVideoFile(null); setExVideoBlob(null);
    setVideoInputMode("url");
    setExerciseEditorOpen(true);
  };

  const openEditExercise = (ex: Exercise) => {
    setExerciseEditorMode("edit");
    setEditingExercise(ex);
    setExName(ex.name);
    setExCategory(ex.category);
    setExNotes(ex.defaultNotes);
    setExVideoUrl(ex.videoUrl || "");
    setExVideoFile(null); setExVideoBlob(null);
    setVideoInputMode(ex.videoUrl ? "url" : "url");
    setExerciseEditorOpen(true);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Nahrajte prosím video soubor");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Maximální velikost videa je 50 MB");
      return;
    }
    setExVideoBlob(file);
    setExVideoFile(URL.createObjectURL(file));
    setExVideoUrl("");
  };

  const uploadExerciseVideo = async (file: File): Promise<string> => {
    const uid = coachId ?? await requireUserId();
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${uid}/exercise-videos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("profile-assets").upload(path, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("profile-assets").getPublicUrl(path).data.publicUrl;
  };

  const handleSaveExercise = async () => {
    if (!exName.trim()) {
      toast.error("Zadejte název cviku");
      return;
    }
    setSavingExercise(true);
    try {
      const videoUrl = exVideoBlob ? await uploadExerciseVideo(exVideoBlob) : exVideoUrl.trim() || null;
      const values = { name: exName.trim(), category: exCategory, default_notes: exNotes.trim(), video_url: videoUrl };
      const isCustom = editingExercise && customExerciseIds.has(editingExercise.id);
      const query = exerciseEditorMode === "edit" && isCustom
        ? from("coach_exercises").update(values).eq("id", editingExercise.id)
        : from("coach_exercises").insert(values);
      const { data, error } = await query.select("id, coach_id, name, category, default_notes, video_url").single();
      if (error) throw error;
      const saved = rowToExercise(data as CoachExerciseRow);
      setCustomExercises(prev => isCustom ? prev.map(e => e.id === saved.id ? saved : e) : [...prev, saved]);
      toast.success(isCustom ? "Cvik upraven!" : "Cvik přidán!");
      setExerciseEditorOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Cvik se nepodařilo uložit.");
    } finally {
      setSavingExercise(false);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    const { error } = await from("coach_exercises").delete().eq("id", id);
    if (error) {
      toast.error("Cvik se nepodařilo smazat.");
      return;
    }
    setCustomExercises(prev => prev.filter(e => e.id !== id));
    toast.success("Cvik smazán");
  };

  const openVideoPreview = (url: string, name: string) => {
    setVideoPreviewUrl(url);
    setVideoPreviewName(name);
    setVideoPreviewOpen(true);
  };

  const getEmbedUrl = (url: string): string | null => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };

  const templateCategories = Array.from(new Set(planTemplates.map(t => t.category)));

  const filteredExercises = searchQuery.trim()
    ? exerciseList.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.defaultNotes.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : exerciseList;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Trénink" description="Plány a knihovna cviků">
        {tab === 'plans' ? (
          <Button size="sm" className="gap-1.5" onClick={handleNewPlan}>
            <Plus className="h-3.5 w-3.5" /> Nový plán
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5" onClick={openNewExercise}>
            <Plus className="h-3.5 w-3.5" /> Nový cvik
          </Button>
        )}
      </PageHeader>

      <div className="flex gap-1 mb-6">
        {(['plans', 'exercises'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <div className="space-y-3">
          {plansLoading && (
            <p className="p-8 text-center text-sm text-muted-foreground">Načítám plány…</p>
          )}
          {!plansLoading && plans.length === 0 && (
            <div className="rounded-xl bg-card shadow-card p-8 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Zatím nemáš žádný tréninkový plán</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Vytvoř plán od nuly nebo ze šablony a přiřaď ho klientovi.</p>
              <Button size="sm" className="gap-1.5" onClick={handleNewPlan}>
                <Plus className="h-3.5 w-3.5" /> Nový plán
              </Button>
            </div>
          )}
          {plans.map(plan => {
            const clientName = clientNameOf(plan.client_id);
            const planExercises = plan.exercises ?? [];
            return (
            <div key={plan.id} className="rounded-xl bg-card shadow-card p-5 hover:shadow-elevated transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{plan.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.client_id ? (
                      <Link to={`/clients/${plan.client_id}`} className="hover:text-primary transition-colors">
                        {clientName}
                      </Link>
                    ) : (
                      <span className="italic">Bez klienta</span>
                    )}
                    {' '}· {format(parseISO(plan.created_at), "d. M. yyyy", { locale: cs })}
                  </p>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={plan.status} />
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleEditPlan(plan)}>
                    <Pencil className="h-3 w-3" /> Upravit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Další akce">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Změnit stav</DropdownMenuLabel>
                      {(Object.keys(planStatusLabels) as PlanStatus[]).map(st => (
                        <DropdownMenuItem key={st} disabled={plan.status === st} onClick={() => handleStatusChange(plan, st)}>
                          {planStatusLabels[st]}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDuplicatePlan(plan)}>
                        <Copy className="h-3.5 w-3.5 mr-2" /> Duplikovat
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingPlan(plan)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Smazat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="rounded-lg bg-subtle overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Cvik</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">Série</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">Opakování</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">RPE</th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Odpočinek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {planExercises.map((ex, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-sm font-medium text-foreground">{ex.exerciseName}</td>
                        <td className="px-3 py-2 text-sm text-center font-mono tabular-nums text-foreground">{ex.sets}</td>
                        <td className="px-3 py-2 text-sm text-center font-mono tabular-nums text-foreground">{ex.reps}</td>
                        <td className="px-3 py-2 text-sm text-center font-mono tabular-nums text-foreground">{ex.rpe}</td>
                        <td className="px-3 py-2 text-sm text-right font-mono tabular-nums text-muted-foreground">{ex.rest}s</td>
                      </tr>
                    ))}
                    {planExercises.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-3 text-xs text-center text-muted-foreground">Plán zatím nemá žádné cviky.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {tab === 'exercises' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat cvik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {(Object.keys(categoryLabels) as ExerciseCategory[]).map(cat => {
            const catExercises = filteredExercises.filter(e => e.category === cat);
            if (catExercises.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {categoryLabels[cat]}
                </h3>
                <div className="rounded-xl bg-card shadow-card divide-y divide-border">
                  {catExercises.map(ex => (
                    <div key={ex.id} className="flex items-center justify-between p-3 px-4 hover:bg-subtle transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{ex.name}</p>
                          {ex.videoUrl && (
                            <button
                              onClick={() => openVideoPreview(ex.videoUrl!, ex.name)}
                              className="text-primary hover:text-primary/80 transition-colors"
                              title="Přehrát video"
                            >
                              <Video className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{ex.defaultNotes}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEditExercise(ex)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {customExerciseIds.has(ex.id) && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteExercise(ex.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Template Picker Dialog */}
      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vyber šablonu nebo začni od nuly</DialogTitle>
          </DialogHeader>
          <button
            onClick={handleStartBlank}
            className="w-full rounded-lg border-2 border-dashed border-border p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2.5"><Plus className="h-5 w-5 text-muted-foreground" /></div>
              <div>
                <p className="text-sm font-semibold text-foreground">Prázdný plán</p>
                <p className="text-xs text-muted-foreground">Začni od nuly a přidej cviky ručně.</p>
              </div>
            </div>
          </button>
          {templateCategories.map(cat => (
            <div key={cat} className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h4>
              <div className="space-y-1.5">
                {planTemplates.filter(t => t.category === cat).map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.exercises, tpl.name, tpl.description)}
                    className="w-full rounded-lg border border-border p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2"><Copy className="h-4 w-4 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground">{tpl.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{tpl.exercises.length} cviků</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </DialogContent>
      </Dialog>

      {/* Plan Editor Dialog */}
      {editingPlan && (
        <PlanEditorDialog
          key={editorKey}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          mode={editorMode}
          clients={clientList}
          exercises={exerciseList}
          initialTitle={editingPlan.title}
          initialDescription={editingPlan.description}
          initialClientId={editingPlan.clientId}
          initialStatus={editingPlan.status}
          initialExercises={editingPlan.exercises}
          onSave={handleSave}
        />
      )}

      {/* Delete plan confirmation */}
      <AlertDialog open={!!deletingPlan} onOpenChange={(o) => !o && setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat plán?</AlertDialogTitle>
            <AlertDialogDescription>
              Plán „{deletingPlan?.title}" bude trvale odstraněn{deletingPlan?.client_id ? " a klient ho přestane vidět" : ""}.
              Záznamy odcvičených tréninků zůstanou zachovány.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeletePlan}
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exercise Editor Dialog */}
      <Dialog open={exerciseEditorOpen} onOpenChange={setExerciseEditorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{exerciseEditorMode === "create" ? "Nový cvik" : "Upravit cvik"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ex-name">Název cviku *</Label>
              <Input id="ex-name" value={exName} onChange={(e) => setExName(e.target.value)} placeholder="např. Back Squat" />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={exCategory} onValueChange={(v) => setExCategory(v as ExerciseCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabels) as ExerciseCategory[]).map(cat => (
                    <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-notes">Poznámky / instrukce</Label>
              <Textarea id="ex-notes" value={exNotes} onChange={(e) => setExNotes(e.target.value)} placeholder="Tipy k provedení cviku..." rows={3} />
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                Video s ukázkou <span className="text-xs font-normal text-muted-foreground">(nepovinné)</span>
              </Label>

              {/* Mode tabs */}
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setVideoInputMode("url")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    videoInputMode === "url" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Odkaz (URL)
                </button>
                <button
                  onClick={() => setVideoInputMode("upload")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    videoInputMode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Nahrát / Natočit
                </button>
              </div>

              {videoInputMode === "url" && (
                <div className="space-y-2">
                  <Input
                    value={exVideoUrl}
                    onChange={(e) => { setExVideoUrl(e.target.value); setExVideoFile(null); setExVideoBlob(null); }}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-[11px] text-muted-foreground">YouTube, Vimeo nebo přímý odkaz na video.</p>
                  {exVideoUrl && getEmbedUrl(exVideoUrl) && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <iframe
                        src={getEmbedUrl(exVideoUrl)!}
                        className="w-full aspect-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Náhled videa"
                      />
                    </div>
                  )}
                </div>
              )}

              {videoInputMode === "upload" && (
                <div className="space-y-3">
                  {exVideoFile ? (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden border border-border">
                        <video src={exVideoFile} controls className="w-full aspect-video bg-black" />
                        <button
                          onClick={() => { setExVideoFile(null); setExVideoBlob(null); }}
                          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Video nahráno. Můžete ho odebrat a nahrát jiné.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Record from camera */}
                      <button
                        onClick={() => videoCaptureRef.current?.click()}
                        className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <Camera className="h-6 w-6 text-primary" />
                        <span className="text-xs font-medium text-foreground">Natočit video</span>
                        <span className="text-[10px] text-muted-foreground text-center">Otevře kameru na telefonu/tabletu</span>
                      </button>
                      {/* Upload from gallery */}
                      <button
                        onClick={() => videoFileRef.current?.click()}
                        className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <Upload className="h-6 w-6 text-primary" />
                        <span className="text-xs font-medium text-foreground">Nahrát soubor</span>
                        <span className="text-[10px] text-muted-foreground text-center">Z galerie nebo počítače</span>
                      </button>
                    </div>
                  )}
                  {/* Hidden file inputs */}
                  <input
                    ref={videoCaptureRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleVideoFileChange}
                  />
                  <input
                    ref={videoFileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoFileChange}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExerciseEditorOpen(false)}>Zrušit</Button>
            <Button onClick={handleSaveExercise} disabled={savingExercise}>
              {exerciseEditorMode === "create" ? "Přidat cvik" : "Uložit změny"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview Dialog */}
      <Dialog open={videoPreviewOpen} onOpenChange={setVideoPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {videoPreviewName}
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg overflow-hidden border border-border">
            {getEmbedUrl(videoPreviewUrl) ? (
              <iframe
                src={getEmbedUrl(videoPreviewUrl)!}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={videoPreviewName}
              />
            ) : (
              <video
                src={videoPreviewUrl}
                controls
                className="w-full aspect-video bg-black"
              >
                Váš prohlížeč nepodporuje přehrávání videa.
              </video>
            )}
          </div>
          <div className="flex justify-end">
            <a href={videoPreviewUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> Otevřít v novém okně
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
