import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, X, Plus, Globe, Building2, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CZECH_CITIES = [
  "Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice",
  "Hradec Králové", "Ústí nad Labem", "Pardubice", "Zlín", "Havířov", "Kladno",
  "Most", "Opava", "Frýdek-Místek", "Karviná", "Jihlava", "Teplice", "Děčín",
  "Karlovy Vary", "Chomutov", "Jablonec nad Nisou", "Mladá Boleslav", "Prostějov",
  "Přerov", "Česká Lípa", "Třebíč", "Třinec", "Tábor", "Znojmo", "Kolín",
  "Příbram", "Cheb", "Písek", "Kroměříž", "Klatovy", "Orlová", "Kopřivnice",
  "Šumperk", "Valašské Meziříčí", "Litvínov", "Sokolov", "Nový Jičín", "Vyškov",
  "Blansko", "Žďár nad Sázavou", "Beroun", "Mělník", "Kutná Hora", "Náchod",
  "Chrudim", "Břeclav", "Svitavy", "Uherské Hradiště", "Hodonín", "Louny",
  "Benešov", "Strakonice", "Litoměřice", "Rakovník", "Domažlice", "Rokycany",
  "Pelhřimov", "Havlíčkův Brod", "Nymburk", "Český Krumlov", "Trutnov", "Rychnov nad Kněžnou",
];

const EQUIPMENT_OPTIONS = [
  { value: "stroje", label: "Stroje" },
  { value: "cinky", label: "Činky a jednoručky" },
  { value: "kardio", label: "Kardio zóna" },
  { value: "skupinove", label: "Skupinové lekce" },
  { value: "crossfit", label: "CrossFit zóna" },
  { value: "bazén", label: "Bazén" },
  { value: "sauna", label: "Sauna / wellness" },
  { value: "stretching", label: "Strečink zóna" },
  { value: "trx", label: "TRX / závěsný systém" },
  { value: "kettlebells", label: "Kettlebells" },
  { value: "olympic", label: "Olympijské plošiny" },
  { value: "outdoor", label: "Venkovní prostory" },
  { value: "parkoviště", label: "Parkování" },
  { value: "box", label: "Box" },
  { value: "kickbox", label: "Kickbox" },
  { value: "mma", label: "MMA" },
  { value: "muay-thai", label: "Muay Thai" },
  { value: "jiu-jitsu", label: "Jiu-Jitsu / BJJ" },
  { value: "judo", label: "Judo" },
  { value: "zapas", label: "Zápas" },
  { value: "karate", label: "Karate" },
  { value: "taekwondo", label: "Taekwondo" },
];

interface Gym {
  id: string;
  name: string;
  address: string;
  city: string;
  website: string;
  equipment: string[];
}

interface TrainingLocationSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TrainingLocationSelect({ value, onChange }: TrainingLocationSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // New gym form state
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newEquipment, setNewEquipment] = useState<string[]>([]);
  const [addingSaving, setAddingSaving] = useState(false);

  useEffect(() => {
    fetchGyms();
  }, []);

  const fetchGyms = async () => {
    const { data, error } = await supabase
      .from("gyms")
      .select("id, name, address, city, website, equipment")
      .order("name");
    if (!error && data) {
      setGyms(data as Gym[]);
    }
  };

  const allOptions = [
    { label: "Kdekoliv / online", type: "preset" as const },
    ...gyms.map(g => ({
      label: `${g.name} – ${g.city}`,
      type: "gym" as const,
      gym: g,
    })),
  ];

  const filtered = allOptions.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
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

  const handleSelect = (label: string) => {
    onChange(label);
    setSearch("");
    setOpen(false);
  };

  const handleInputChange = (val: string) => {
    setSearch(val);
    if (!open) setOpen(true);
  };

  const toggleEquipment = (eq: string) => {
    setNewEquipment(prev =>
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  };

  const resetForm = () => {
    setNewName("");
    setNewAddress("");
    setNewCity("");
    setNewWebsite("");
    setNewEquipment([]);
  };

  const handleAddGym = async () => {
    if (!newName.trim()) {
      toast.error("Název gymu je povinný");
      return;
    }
    if (!newCity) {
      toast.error("Město je povinné");
      return;
    }

    setAddingSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Musíte být přihlášeni");
      setAddingSaving(false);
      return;
    }

    const { error } = await supabase.from("gyms").insert({
      name: newName.trim(),
      address: newAddress.trim(),
      city: newCity,
      website: newWebsite.trim(),
      equipment: newEquipment,
      created_by: user.id,
    });

    if (error) {
      toast.error("Nepodařilo se přidat gym");
      console.error(error);
    } else {
      toast.success("Gym úspěšně přidán!");
      await fetchGyms();
      const selected = `${newName.trim()} – ${newCity}`;
      onChange(selected);
      resetForm();
      setShowAddDialog(false);
    }
    setAddingSaving(false);
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={open ? search : value}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => { setOpen(true); setSearch(value === "Kdekoliv / online" ? "" : value); }}
            placeholder="Hledejte gym nebo vyberte..."
            className="pl-8 pr-8"
            maxLength={150}
            readOnly={false}
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
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
            {/* Add new gym button */}
            <button
              type="button"
              onClick={() => { setShowAddDialog(true); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-2 border-b border-border text-primary font-medium"
            >
              <Plus className="h-4 w-4" />
              Přidat nový gym
            </button>

            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                Žádné výsledky
              </div>
            ) : (
              filtered.map((opt, i) => (
                <button
                  key={`${opt.type}-${i}`}
                  type="button"
                  onClick={() => handleSelect(opt.label)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2",
                    value === opt.label && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  {opt.type === "preset" ? (
                    <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add New Gym Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Přidat nový gym
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Název gymu *</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="např. Gold's Gym Praha"
                maxLength={100}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Město *</Label>
              <Select value={newCity} onValueChange={setNewCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte město" />
                </SelectTrigger>
                <SelectContent>
                  {CZECH_CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Adresa</Label>
              <Input
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                placeholder="např. Vinohradská 123, Praha 2"
                maxLength={200}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Web gymu</Label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={newWebsite}
                  onChange={e => setNewWebsite(e.target.value)}
                  placeholder="https://www.gym.cz"
                  className="pl-8"
                  maxLength={200}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <Dumbbell className="h-4 w-4" />
                Vybavení gymu
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map(eq => (
                  <label
                    key={eq.value}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
                      newEquipment.includes(eq.value)
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <Checkbox
                      checked={newEquipment.includes(eq.value)}
                      onCheckedChange={() => toggleEquipment(eq.value)}
                    />
                    {eq.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { resetForm(); setShowAddDialog(false); }}>
              Zrušit
            </Button>
            <Button onClick={handleAddGym} disabled={addingSaving}>
              {addingSaving ? "Ukládám..." : "Přidat gym"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
