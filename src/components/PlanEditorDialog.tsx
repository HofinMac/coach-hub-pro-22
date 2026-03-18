import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exercises as allExercises, clients, type PlanExercise, type ExerciseCategory, type PlanStatus } from "@/lib/demo-data";
import { Plus, Trash2, GripVertical, Search } from "lucide-react";
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

interface PlanEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialTitle?: string;
  initialClientId?: string;
  initialStatus?: PlanStatus;
  initialExercises?: PlanExercise[];
  onSave: (data: {
    title: string;
    clientId: string;
    status: PlanStatus;
    exercises: PlanExercise[];
  }) => void;
}

export default function PlanEditorDialog({
  open, onOpenChange, mode, initialTitle = "", initialClientId = "",
  initialStatus = "draft", initialExercises = [], onSave,
}: PlanEditorDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [clientId, setClientId] = useState(initialClientId);
  const [status, setStatus] = useState<PlanStatus>(initialStatus);
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>(initialExercises);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | "all">("all");

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTitle(initialTitle);
      setClientId(initialClientId);
      setStatus(initialStatus);
      setPlanExercises([...initialExercises]);
      setShowExercisePicker(false);
      setSearchQuery("");
    }
    onOpenChange(isOpen);
  };

  const addExercise = (exerciseId: string, exerciseName: string) => {
    setPlanExercises(prev => [
      ...prev,
      { exerciseId, exerciseName, sets: 3, reps: "10", rpe: 7, rest: 90 },
    ]);
  };

  const removeExercise = (idx: number) => {
    setPlanExercises(prev => prev.filter((_, i) => i !== idx));
  };

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
    setPlanExercises(arr);
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error("Zadej název plánu."); return; }
    if (!clientId) { toast.error("Vyber klienta."); return; }
    if (planExercises.length === 0) { toast.error("Přidej alespoň jeden cvik."); return; }
    onSave({ title: title.trim(), clientId, status, exercises: planExercises });
    onOpenChange(false);
  };

  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || ex.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nový tréninkový plán" : "Upravit plán"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Plan metadata */}
          <div className="grid grid-cols-2 gap-3">
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
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {planExercises.map((ex, i) => (
                      <tr key={i} className="group">
                        <td className="px-1">
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => moveExercise(i, -1)}
                              disabled={i === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                            >▲</button>
                            <button
                              onClick={() => moveExercise(i, 1)}
                              disabled={i === planExercises.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                            >▼</button>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-sm font-medium text-foreground">{ex.exerciseName}</td>
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
                          <button
                            onClick={() => removeExercise(i)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          <DialogClose asChild>
            <Button variant="outline">Zrušit</Button>
          </DialogClose>
          <Button onClick={handleSave}>
            {mode === "create" ? "Vytvořit plán" : "Uložit změny"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
