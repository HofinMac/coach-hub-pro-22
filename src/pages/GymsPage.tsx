import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { gyms as initialGyms, getReviewsForTarget, type Gym } from "@/lib/gym-data";
import { Plus, MapPin, Clock, Star, Pencil, Trash2, Dumbbell } from "lucide-react";
import { toast } from "sonner";

const COACH_ID = "c1";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "fill-warning text-warning" : "text-border"}`}
        />
      ))}
      <span className="text-xs font-medium text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function GymsPage() {
  const [gymList, setGymList] = useState<Gym[]>(initialGyms.filter(g => g.coachIds.includes(COACH_ID)));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [expandedGym, setExpandedGym] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  const openCreate = () => {
    setEditingGym(null);
    setName(""); setAddress(""); setCity(""); setDescription(""); setAmenities(""); setOpeningHours("");
    setDialogOpen(true);
  };

  const openEdit = (gym: Gym) => {
    setEditingGym(gym);
    setName(gym.name); setAddress(gym.address); setCity(gym.city);
    setDescription(gym.description); setAmenities(gym.amenities.join(", "));
    setOpeningHours(gym.openingHours);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !address.trim() || !city.trim()) {
      toast.error("Vyplň název, adresu a město.");
      return;
    }
    const amenitiesList = amenities.split(",").map(a => a.trim()).filter(Boolean);

    if (editingGym) {
      setGymList(prev => prev.map(g =>
        g.id === editingGym.id
          ? { ...g, name: name.trim(), address: address.trim(), city: city.trim(), description: description.trim(), amenities: amenitiesList, openingHours: openingHours.trim() }
          : g
      ));
      toast.success("Pobočka aktualizována!");
    } else {
      const newGym: Gym = {
        id: `g_new_${Date.now()}`, name: name.trim(), address: address.trim(), city: city.trim(),
        description: description.trim(), amenities: amenitiesList, openingHours: openingHours.trim(),
        coachIds: [COACH_ID], rating: 0, reviewCount: 0,
      };
      setGymList(prev => [...prev, newGym]);
      toast.success("Pobočka přidána!");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setGymList(prev => prev.filter(g => g.id !== id));
    toast.success("Pobočka odstraněna.");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Posilovny" description="Pobočky, kde trénuješ své klienty.">
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Přidat pobočku
        </Button>
      </PageHeader>

      {gymList.length === 0 ? (
        <div className="rounded-xl bg-card shadow-card p-12 text-center">
          <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Zatím nemáš přidanou žádnou posilovnu.</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Přidat první pobočku
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {gymList.map(gym => {
            const gymReviews = getReviewsForTarget("gym", gym.id);
            const isExpanded = expandedGym === gym.id;
            return (
              <div key={gym.id} className="rounded-xl bg-card shadow-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground">{gym.name}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {gym.address}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {gym.openingHours}
                        </span>
                      </div>
                      {gym.rating > 0 && (
                        <div className="mt-2">
                          <StarRating rating={gym.rating} />
                          <span className="text-xs text-muted-foreground ml-1">({gym.reviewCount} hodnocení)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openEdit(gym)}>
                        <Pencil className="h-3 w-3" /> Upravit
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(gym.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {gym.description && (
                    <p className="text-sm text-muted-foreground mt-3">{gym.description}</p>
                  )}

                  {gym.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {gym.amenities.map(a => (
                        <span key={a} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{a}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reviews toggle */}
                {gymReviews.length > 0 && (
                  <div className="border-t border-border">
                    <button
                      onClick={() => setExpandedGym(isExpanded ? null : gym.id)}
                      className="w-full px-5 py-2.5 text-left text-xs font-medium text-muted-foreground hover:bg-subtle transition-colors"
                    >
                      {isExpanded ? "Skrýt" : "Zobrazit"} hodnocení ({gymReviews.length})
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4 space-y-3">
                        {gymReviews.map(r => (
                          <div key={r.id} className="rounded-lg bg-subtle p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">{r.clientName}</span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-warning text-warning" : "text-border"}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{r.comment}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">{r.createdAt}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGym ? "Upravit pobočku" : "Přidat novou pobočku"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Název posilovny *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Apex Fitness Praha" maxLength={100} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 grid gap-1.5">
                <Label>Adresa *</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Vinohradská 42, Praha 2" maxLength={150} />
              </div>
              <div className="grid gap-1.5">
                <Label>Město *</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Praha" maxLength={50} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Popis</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Popis posilovny, vybavení..." maxLength={300} className="min-h-[80px]" />
            </div>
            <div className="grid gap-1.5">
              <Label>Vybavení (oddělené čárkou)</Label>
              <Input value={amenities} onChange={e => setAmenities(e.target.value)} placeholder="Squat racky, Kardio zóna, Sprchy..." maxLength={300} />
            </div>
            <div className="grid gap-1.5">
              <Label>Otevírací doba</Label>
              <Input value={openingHours} onChange={e => setOpeningHours(e.target.value)} placeholder="Po–Pá 6:00–22:00, So–Ne 8:00–20:00" maxLength={100} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Zrušit</Button></DialogClose>
            <Button onClick={handleSave}>{editingGym ? "Uložit změny" : "Přidat pobočku"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
