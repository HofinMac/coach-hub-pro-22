import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { exercises as builtInExercises, type Exercise, type PlanExercise, type ExerciseCategory, type PlanStatus } from "@/lib/domain";
import { Plus, Trash2, Search, Loader2, Link2, Unlink2 } from "lucide-react";
import { isLinkedToNext, linkWithNext, normalizeSupersets, supersetLabels as supersetLabelsOf, unlinkFromNext } from "@/lib/supersets";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categoryLabels: Record<ExerciseCategory, string> = {
  knee_dominant: "Dominance kolene",
  hip_dominant: "Dominance kyčle",
  push: "Tlak",
  pull: "Tah",
  core: "Střed těla",
  conditioning: "Kondice",
  mobility: "Mobilita",
};

const NO_CLIENT = "__none__";

export interface PlanEditorData {
  title: string;
  description: string;
  clientId: string | null;
  status: PlanStatus;
  exercises: PlanExercise[];
}

interface PlanEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  /** Clients the plan can be assigned to (the coach's assigned clients). */
  clients: { id: string; name: string }[];
  /** Exercise library to pick from (built-in + coach's own). */
  exercises?: Exercise[];
  initialTitle?: string;
  initialDescription?: string;
  initialClientId?: string | null;
  initialStatus?: PlanStatus;
  initialExercises?: PlanExercise[];
  /** Return false to keep the dialog open (e.g. when saving failed). */
  onSave: (data: PlanEditorData) => Promise<boolean> | boolean;
}

/** Mount with a fresh `key` per opening so the form starts from the initial values. */
export default function PlanEditorDialog({
  open, onOpenChange, mode, clients, exercises: allExercises = builtInExercises, initialTitle = "", initialDescription = "", initialClientId = null,
  initialStatus = "draft", initialExercises = [], onSave,
}: PlanEditorDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [clientId, setClientId] = useState<string>(initialClientId ?? NO_CLIENT);
  const [status, setStatus] = useState<PlanStatus>(initialStatus);
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>(() => [...initialExercises]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | "all">("all");
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Unsaved-changes guard: compare against the values the dialog opened with.
  const snapshot = () => JSON.stringify({ title, description, clientId, status, planExercises });
  const [initialSnapshot] = useState(snapshot);
  const dirty = snapshot() !== initialSnapshot;

  const requestClose = () => {
    if (saving) return;
    if (dirty) setConfirmDiscard(true);
    else onOpenChange(false);
  };

  // Closing the tab / reloading with an unsaved plan asks the browser to confirm.
  useEffect(() => {
    if (!open || !dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [open, dirty]);

  const addExercise = (exerciseId: string, exerciseName: string) => {
    setPlanExercises(prev => [
      ...prev,
      { exerciseId, exerciseName, sets: 3, reps: "10", rpe: 7, rest: 90 },
    ]);
  };

  const removeExercise = (idx: number) => {
    setPlanExercises(prev => normalizeSupersets(prev.filter((_, i) => i !== idx)));
  };

  const toggleLinkWithNext = (idx: number) => {
    setPlanExercises(prev => (isLinkedToNext(prev, idx) ? unlinkFromNext(prev, idx) : linkWithNext(prev, idx)));
  };

  // "A1", "A2"… for exercises in a superset, keyed by position.
  const supersetLabels = supersetLabelsOf(planExercises);

  const updateExercise = (idx: number, field: keyof PlanExercise, value: string | number) => {
    setPlanExercises(prev =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex))
    );
  };

  const moveExercise = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= planExercises.length) return;
    const arr = [...planExercises];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setPlanExercises(normalizeSupersets(arr));
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Zadej název plánu."); return; }
    if (planExercises.length === 0) { toast.error("Přidej alespoň jeden cvik."); return; }
    setSaving(true);
    try {
      const ok = await onSave({
        title: title.trim(),
        description: description.trim(),
        clientId: clientId === NO_CLIENT ? null : clientId,
        status,
        exercises: planExercises,
      });
      if (ok !== false) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  // Keep a stale client (e.g. no longer assigned) selectable so editing doesn't silently drop it.
  const clientOptions = clientId !== NO_CLIENT && !clients.some(c => c.id === clientId)
    ? [...clients, { id: clientId, name: "Neznámý klient" }]
    : clients;

  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || ex.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        // A stray click outside must not throw away a half-built plan.
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nový tréninkový plán" : "Upravit plán"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Plan metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Název plánu</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="např. Push Day – Week 4"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Klient</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Vyber klienta" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CLIENT}>Bez klienta (šablona)</SelectItem>
                  {clientOptions.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Popis (nepovinné)</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Cíl plánu, frekvence, poznámky pro klienta…"
              rows={2}
            />
          </div>

          <div className="grid gap-1.5 max-w-[200px]">
            <Label className="text-xs">Stav</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PlanStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Koncept</SelectItem>
                <SelectItem value="active">Aktivní</SelectItem>
                <SelectItem value="completed">Dokončený</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercise list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">Cviky ({planExercises.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setShowExercisePicker(!showExercisePicker)}
              >
                <Plus className="h-3 w-3" />
                Přidat cvik
              </Button>
            </div>

            {planExercises.length === 0 && !showExercisePicker && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">Zatím žádné cviky. Klikni na „Přidat cvik".</p>
              </div>
            )}

            {planExercises.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-subtle border-b border-border">
                      <th className="w-8"></th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-2 py-1.5">Cvik</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-1 py-1.5 w-16">Série</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-1 py-1.5 w-20">Opak.</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-1 py-1.5 w-16">RPE</th>
                      <th className="text-center text-xs font-medium text-muted-foreground px-1 py-1.5 w-16">Odp.(s)</th>
                      <th className="w-14"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {planExercises.map((ex, i) => (
                      <tr
                        key={i}
                        className={cn(
                          "group",
                          supersetLabels.has(i) && "bg-primary/5",
                          isLinkedToNext(planExercises, i) && "!border-b-0",
                        )}
                      >
                        <td className="px-1">
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => moveExercise(i, -1)}
                              disabled={i === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                            >▲</button>
                            <button
                              type="button"
                              onClick={() => moveExercise(i, 1)}
                              disabled={i === planExercises.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                            >▼</button>
                          </div>
                        </td>
                        <td className={cn("px-2 py-1.5 text-sm font-medium text-foreground", supersetLabels.has(i) && "border-l-2 border-l-primary")}>
                          {supersetLabels.has(i) && (
                            <span className="mr-1.5 inline-flex rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary align-middle">
                              {supersetLabels.get(i)}
                            </span>
                          )}
                          {ex.exerciseName}
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number" min={1} value={ex.sets}
                            onChange={e => updateExercise(i, "sets", parseInt(e.target.value) || 1)}
                            className="h-7 text-center text-xs px-1"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            value={ex.reps}
                            onChange={e => updateExercise(i, "reps", e.target.value)}
                            className="h-7 text-center text-xs px-1"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number" min={1} max={10} step={0.5} value={ex.rpe}
                            onChange={e => updateExercise(i, "rpe", parseFloat(e.target.value) || 5)}
                            className="h-7 text-center text-xs px-1"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <Input
                            type="number" min={0} step={15} value={ex.rest}
                            onChange={e => updateExercise(i, "rest", parseInt(e.target.value) || 0)}
                            className="h-7 text-center text-xs px-1"
                          />
                        </td>
                        <td className="px-1">
                          <div className="flex items-center">
                          {i < planExercises.length - 1 && (
                            <button
                              type="button"
                              onClick={() => toggleLinkWithNext(i)}
                              className={cn(
                                "p-1 transition-colors",
                                isLinkedToNext(planExercises, i) ? "text-primary hover:text-destructive" : "text-muted-foreground hover:text-primary",
                              )}
                              title={isLinkedToNext(planExercises, i) ? "Rozpojit supersérii" : "Spojit s dalším cvikem do supersérie"}
                              aria-label={isLinkedToNext(planExercises, i) ? "Rozpojit supersérii" : "Spojit s dalším cvikem do supersérie"}
                            >
                              {isLinkedToNext(planExercises, i) ? <Unlink2 className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExercise(i)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {planExercises.length > 1 && (
              <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3 shrink-0" />
                {supersetLabels.size > 0
                  ? "Supersérie (A1, A2…) se cvičí po sobě bez pauzy, odpočinek platí až po posledním cviku."
                  : "Ikonou řetězu spojíte cvik s následujícím do supersérie."}
              </p>
            )}
          </div>

          {/* Exercise picker */}
          {showExercisePicker && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Hledat cvik..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as ExerciseCategory | "all")}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny kategorie</SelectItem>
                    {(Object.keys(categoryLabels) as ExerciseCategory[]).map(cat => (
                      <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredExercises.map(ex => {
                  const alreadyAdded = planExercises.some(pe => pe.exerciseId === ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => !alreadyAdded && addExercise(ex.id, ex.name)}
                      disabled={alreadyAdded}
                      className={cn(
                        "w-full flex items-center justify-between rounded-md px-3 py-1.5 text-left transition-colors",
                        alreadyAdded
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-primary/10 cursor-pointer"
                      )}
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">{ex.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{categoryLabels[ex.category]}</span>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs text-muted-foreground">Přidáno</span>
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      )}
                    </button>
                  );
                })}
                {filteredExercises.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Žádný cvik nenalezen.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={requestClose}>Zrušit</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "create" ? "Vytvořit plán" : "Uložit změny"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zahodit rozpracovaný trénink?</AlertDialogTitle>
          <AlertDialogDescription>
            Máte neuložené změny. Pokud okno zavřete, ztratí se.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Pokračovat v úpravách</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { setConfirmDiscard(false); onOpenChange(false); }}
          >
            Zahodit změny
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
