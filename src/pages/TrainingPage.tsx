import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Copy, Trash2, Video, ExternalLink, Search, Camera, Upload, X } from "lucide-react";
import { workoutPlans, exercises as defaultExercises, clients, type Exercise, type ExerciseCategory, type PlanExercise, type PlanStatus } from "@/lib/demo-data";
import { planTemplates } from "@/lib/plan-templates";
import { StatusBadge } from "@/components/StatusBadge";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import PlanEditorDialog from "@/components/PlanEditorDialog";
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

interface LocalPlan {
  id: string;
  coachId: string;
  clientId: string;
  clientName: string;
  title: string;
  status: PlanStatus;
  exercises: PlanExercise[];
  createdAt: string;
}

export default function TrainingPage() {
  const [tab, setTab] = useState<'plans' | 'exercises'>('plans');
  const [plans, setPlans] = useState<LocalPlan[]>([...workoutPlans]);
  const [exerciseList, setExerciseList] = useState<Exercise[]>([...defaultExercises]);
  const [searchQuery, setSearchQuery] = useState("");

  // Plan editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingPlan, setEditingPlan] = useState<LocalPlan | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // Exercise editor state
  const [exerciseEditorOpen, setExerciseEditorOpen] = useState(false);
  const [exerciseEditorMode, setExerciseEditorMode] = useState<"create" | "edit">("create");
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exName, setExName] = useState("");
  const [exCategory, setExCategory] = useState<ExerciseCategory>("knee_dominant");
  const [exNotes, setExNotes] = useState("");
  const [exVideoUrl, setExVideoUrl] = useState("");
  const [exVideoFile, setExVideoFile] = useState<string | null>(null); // base64 data URL for recorded/uploaded video
  const [videoInputMode, setVideoInputMode] = useState<"url" | "upload">("url");
  const videoFileRef = useRef<HTMLInputElement>(null);
  const videoCaptureRef = useRef<HTMLInputElement>(null);

  // Video preview state
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoPreviewName, setVideoPreviewName] = useState("");

  // --- Plan handlers ---
  const handleNewPlan = () => setTemplatePickerOpen(true);

  const handleSelectTemplate = (templateExercises: PlanExercise[], templateName?: string) => {
    setTemplatePickerOpen(false);
    setEditorMode("create");
    setEditingPlan({
      id: '', coachId: 'c1', clientId: '', clientName: '',
      title: templateName || '', status: 'draft',
      exercises: [...templateExercises],
      createdAt: new Date().toISOString().split('T')[0],
    });
    setEditorOpen(true);
  };

  const handleStartBlank = () => {
    setTemplatePickerOpen(false);
    setEditorMode("create");
    setEditingPlan({
      id: '', coachId: 'c1', clientId: '', clientName: '',
      title: '', status: 'draft', exercises: [],
      createdAt: new Date().toISOString().split('T')[0],
    });
    setEditorOpen(true);
  };

  const handleEditPlan = (plan: LocalPlan) => {
    setEditorMode("edit");
    setEditingPlan(plan);
    setEditorOpen(true);
  };

  const handleSave = (data: { title: string; clientId: string; status: PlanStatus; exercises: PlanExercise[] }) => {
    const clientName = clients.find(c => c.id === data.clientId)?.name || "";
    if (editorMode === "create") {
      const newPlan: LocalPlan = {
        id: `wp_new_${Date.now()}`, coachId: 'c1', clientId: data.clientId, clientName,
        title: data.title, status: data.status, exercises: data.exercises,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setPlans(prev => [newPlan, ...prev]);
      toast.success("Plán vytvořen!");
    } else if (editingPlan) {
      setPlans(prev => prev.map(p =>
        p.id === editingPlan.id
          ? { ...p, title: data.title, clientId: data.clientId, clientName, status: data.status, exercises: data.exercises }
          : p
      ));
      toast.success("Plán aktualizován!");
    }
  };

  // --- Exercise handlers ---
  const openNewExercise = () => {
    setExerciseEditorMode("create");
    setEditingExercise(null);
    setExName("");
    setExCategory("knee_dominant");
    setExNotes("");
    setExVideoUrl("");
    setExVideoFile(null);
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
    setExVideoFile(null);
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
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Maximální velikost videa je 100 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setExVideoFile(reader.result as string);
      setExVideoUrl("");
    };
    reader.readAsDataURL(file);
    toast.success(`Video "${file.name}" nahráno`);
  };

  const getEffectiveVideoUrl = (): string | undefined => {
    if (exVideoFile) return exVideoFile;
    if (exVideoUrl.trim()) return exVideoUrl.trim();
    return undefined;
  };

  const handleSaveExercise = () => {
    if (!exName.trim()) {
      toast.error("Zadejte název cviku");
      return;
    }
    const videoUrl = getEffectiveVideoUrl();
    if (exerciseEditorMode === "create") {
      const newEx: Exercise = {
        id: `ex_${Date.now()}`,
        name: exName.trim(),
        category: exCategory,
        defaultNotes: exNotes.trim(),
        videoUrl,
      };
      setExerciseList(prev => [...prev, newEx]);
      toast.success("Cvik přidán!");
    } else if (editingExercise) {
      setExerciseList(prev => prev.map(e =>
        e.id === editingExercise.id
          ? { ...e, name: exName.trim(), category: exCategory, defaultNotes: exNotes.trim(), videoUrl }
          : e
      ));
      toast.success("Cvik upraven!");
    }
    setExerciseEditorOpen(false);
  };

  const handleDeleteExercise = (id: string) => {
    setExerciseList(prev => prev.filter(e => e.id !== id));
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
          {plans.map(plan => (
            <div key={plan.id} className="rounded-xl bg-card shadow-card p-5 hover:shadow-elevated transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{plan.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <Link to={`/clients/${plan.clientId}`} className="hover:text-primary transition-colors">
                      {plan.clientName}
                    </Link>
                    {' '}· {plan.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleEditPlan(plan)}>
                    <Pencil className="h-3 w-3" /> Upravit
                  </Button>
                  <StatusBadge status={plan.status as any} />
                </div>
              </div>
              <div className="rounded-lg bg-subtle overflow-hidden">
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
                    {plan.exercises.map((ex, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-sm font-medium text-foreground">{ex.exerciseName}</td>
                        <td className="px-3 py-2 text-sm text-center font-mono tabular-nums text-foreground">{ex.sets}</td>
                        <td className="px-3 py-2 text-sm text-center font-mono tabular-nums text-foreground">{ex.reps}</td>
                        <td className="px-3 py-2 text-sm text-center font-mono tabular-nums text-foreground">{ex.rpe}</td>
                        <td className="px-3 py-2 text-sm text-right font-mono tabular-nums text-muted-foreground">{ex.rest}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteExercise(ex.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
                    onClick={() => handleSelectTemplate(tpl.exercises, tpl.name)}
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
          open={editorOpen}
          onOpenChange={setEditorOpen}
          mode={editorMode}
          initialTitle={editingPlan.title}
          initialClientId={editingPlan.clientId}
          initialStatus={editingPlan.status}
          initialExercises={editingPlan.exercises}
          onSave={handleSave}
        />
      )}

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
            <div className="space-y-2">
              <Label htmlFor="ex-video" className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                Video URL (YouTube / Vimeo / přímý odkaz)
              </Label>
              <Input
                id="ex-video"
                value={exVideoUrl}
                onChange={(e) => setExVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-[11px] text-muted-foreground">
                Vložte odkaz na YouTube, Vimeo nebo přímý odkaz na video soubor.
              </p>
              {exVideoUrl && getEmbedUrl(exVideoUrl) && (
                <div className="rounded-lg overflow-hidden border border-border mt-2">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExerciseEditorOpen(false)}>Zrušit</Button>
            <Button onClick={handleSaveExercise}>
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
