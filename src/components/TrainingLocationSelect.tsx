import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

const POPULAR_LOCATIONS = [
  // Kdekoliv
  "Kdekoliv / online",
  // Praha
  "Praha – centrum", "Praha – Vinohrady", "Praha – Žižkov", "Praha – Smíchov", "Praha – Letná", "Praha – Karlín",
  // Další města
  "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové", "Ústí nad Labem", "Pardubice", "Zlín", "Karlovy Vary", "Jihlava", "Kladno",
  // Populární gymy
  "John Reed Fitness", "Fitness Park", "Factory Pro", "Gold's Gym", "Holmes Place", "F45 Training", "CrossFit Box",
  "Sportovní hala", "Venkovní prostory", "Domácí studio", "Klientův byt/dům",
];

interface TrainingLocationSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TrainingLocationSelect({ value, onChange }: TrainingLocationSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = POPULAR_LOCATIONS.filter(loc =>
    loc.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (loc: string) => {
    onChange(loc);
    setSearch("");
    setOpen(false);
  };

  const handleInputChange = (val: string) => {
    setSearch(val);
    onChange(val);
    if (!open) setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={open ? search : value}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => { setOpen(true); setSearch(value === "Kdekoliv / online" ? "" : value); }}
          placeholder="Hledejte město, gym..."
          className="pl-8 pr-8"
          maxLength={150}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setSearch(""); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
          {filtered.length === 0 && search.trim() ? (
            <button
              type="button"
              onClick={() => handleSelect(search.trim())}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              Použít: <span className="font-medium">{search.trim()}</span>
            </button>
          ) : (
            filtered.map(loc => (
              <button
                key={loc}
                type="button"
                onClick={() => handleSelect(loc)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2",
                  value === loc && "bg-primary/10 text-primary font-medium"
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {loc}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
