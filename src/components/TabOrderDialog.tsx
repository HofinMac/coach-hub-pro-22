import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import { ChevronUp, ChevronDown, Plus, Minus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface TabOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allItems: NavItem[];
  mainTabs: string[];
  onMoveUp: (to: string) => void;
  onMoveDown: (to: string) => void;
  onAdd: (to: string) => void;
  onRemove: (to: string) => void;
  onReset: () => void;
}

export default function TabOrderDialog({
  open, onOpenChange, allItems, mainTabs,
  onMoveUp, onMoveDown, onAdd, onRemove, onReset,
}: TabOrderDialogProps) {
  const mainItems = mainTabs
    .map(to => allItems.find(i => i.to === to))
    .filter(Boolean) as NavItem[];

  const availableItems = allItems.filter(i => !mainTabs.includes(i.to));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Upravit záložky</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Active tabs */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Spodní lišta ({mainTabs.length}/4)
            </p>
            <div className="space-y-1">
              {mainItems.map((item, idx) => (
                <div key={item.to}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/5 border border-primary/15">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => onMoveUp(item.to)} disabled={idx === 0}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent disabled:opacity-30 transition-colors">
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => onMoveDown(item.to)} disabled={idx === mainItems.length - 1}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent disabled:opacity-30 transition-colors">
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => onRemove(item.to)} disabled={mainTabs.length <= 2}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/10 disabled:opacity-30 transition-colors">
                      <Minus className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available tabs */}
          {availableItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Dostupné záložky
              </p>
              <div className="space-y-1">
                {availableItems.map(item => (
                  <div key={item.to}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-border">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground flex-1">{item.label}</span>
                    <button onClick={() => onAdd(item.to)} disabled={mainTabs.length >= 4}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-primary/10 disabled:opacity-30 transition-colors">
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" /> Výchozí
          </Button>
          <DialogClose asChild>
            <Button size="sm">Hotovo</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
