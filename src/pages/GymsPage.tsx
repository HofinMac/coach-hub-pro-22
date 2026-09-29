import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { from, requireUserId, type GymRow, type GymReviewRow } from "@/lib/db";
import { Plus, MapPin, Clock, Star, Pencil, Trash2, Dumbbell, Search, Link2 } from "lucide-react";
import { toast } from "sonner";

type ReviewWithAuthor = GymReviewRow & { authorName: string };

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

async function fetchCoachGyms() {
  const userId = await requireUserId();
  const { data: links, error } = await from("coach_gyms").select("gym_id, gyms(*)").eq("coach_id", userId);
  if (error) throw error;
  const gyms = ((links ?? []) as { gyms: GymRow | null }[])
    .map(l => l.gyms)
    .filter((g): g is GymRow => !!g)
    .sort((a, b) => a.name.localeCompare(b.name, "cs"));

  let reviews: ReviewWithAuthor[] = [];
  if (gyms.length > 0) {
    const { data, error: revErr } = await from("gym_reviews")
      .select("*")
      .in("gym_id", gyms.map(g => g.id))
      .order("created_at", { ascending: false });
    if (revErr) throw revErr;
    const rows = (data ?? []) as GymReviewRow[];
    const authorIds = [...new Set(rows.map(r => r.author_id))];
    const names = new Map<string, string>();
    if (authorIds.length > 0) {
      // RLS only returns profiles the coach may see (own clients); others stay anonymous.
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", authorIds);
      (profiles ?? []).forEach(p => names.set(p.id, p.full_name));
    }
    reviews = rows.map(r => ({ ...r, authorName: names.get(r.author_id) || "Klient" }));
  }
  return { userId, gyms, reviews };
}

export default function GymsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["coach-gyms"], queryFn: fetchCoachGyms });
  const gymList = data?.gyms ?? [];
  const reviews = data?.reviews ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<GymRow | null>(null);
  const [expandedGym, setExpandedGym] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  const { data: allGyms = [] } = useQuery({
    queryKey: ["all-gyms"],
    enabled: dialogOpen && !editingGym,
    queryFn: async () => {
      const { data, error } = await from("gyms").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as GymRow[];
    },
  });

  const linkedIds = new Set(gymList.map(g => g.id));
  const q = search.trim().toLowerCase();
  const searchResults = q
    ? allGyms.filter(g => !linkedIds.has(g.id) && `${g.name} ${g.city} ${g.address}`.toLowerCase().includes(q)).slice(0, 5)
    : [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["coach-gyms"] });

  const openCreate = () => {
    setEditingGym(null);
    setSearch("");
    setName(""); setAddress(""); setCity(""); setDescription(""); setAmenities(""); setOpeningHours("");
    setDialogOpen(true);
  };

  const openEdit = (gym: GymRow) => {
    setEditingGym(gym);
    setName(gym.name); setAddress(gym.address); setCity(gym.city);
    setDescription(gym.description ?? ""); setAmenities((gym.equipment ?? []).join(", "));
    setOpeningHours(gym.opening_hours ?? "");
    setDialogOpen(true);
  };

  const linkGym = async (gymId: string) => {
    setSaving(true);
    try {
      const userId = await requireUserId();
      const { error } = await from("coach_gyms").insert({ coach_id: userId, gym_id: gymId });
      if (error) throw error;
      toast.success("Pobočka přidána!");
      setDialogOpen(false);
      await refresh();
    } catch {
      toast.error("Pobočku se nepodařilo přidat.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !address.trim() || !city.trim()) {
      toast.error("Vyplň název, adresu a město.");
      return;
    }
    const fields = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      description: description.trim(),
      equipment: amenities.split(",").map(a => a.trim()).filter(Boolean),
      opening_hours: openingHours.trim(),
    };

    setSaving(true);
    try {
      const userId = await requireUserId();
      if (editingGym) {
        const { error } = await from("gyms").update(fields).eq("id", editingGym.id);
        if (error) throw error;
        toast.success("Pobočka aktualizována!");
      } else {
        const { data: gym, error } = await from("gyms").insert({ ...fields, created_by: userId }).select("id").single();
        if (error) throw error;
        const { error: linkErr } = await from("coach_gyms").insert({ coach_id: userId, gym_id: gym.id });
        if (linkErr) throw linkErr;
        toast.success("Pobočka přidána!");
        queryClient.invalidateQueries({ queryKey: ["all-gyms"] });
      }
      setDialogOpen(false);
      await refresh();
    } catch {
      toast.error("Pobočku se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const userId = await requireUserId();
      const { error } = await from("coach_gyms").delete().eq("coach_id", userId).eq("gym_id", id);
      if (error) throw error;
      toast.success("Pobočka odebrána.");
      await refresh();
    } catch {
      toast.error("Pobočku se nepodařilo odebrat.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Posilovny" description="Pobočky, kde trénuješ své klienty.">
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Přidat pobočku
        </Button>
      </PageHeader>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Načítám posilovny…</p>
      ) : gymList.length === 0 ? (
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
            const gymReviews = reviews.filter(r => r.gym_id === gym.id);
            const rating = gymReviews.length ? gymReviews.reduce((s, r) => s + r.rating, 0) / gymReviews.length : 0;
            const isExpanded = expandedGym === gym.id;
            const canEdit = gym.created_by === data?.userId;
            return (
              <div key={gym.id} className="rounded-xl bg-card shadow-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground">{gym.name}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {[gym.address, gym.city].filter(Boolean).join(", ")}
                        </span>
                        {gym.opening_hours && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {gym.opening_hours}
                          </span>
                        )}
                      </div>
                      {rating > 0 && (
                        <div className="mt-2">
                          <StarRating rating={rating} />
                          <span className="text-xs text-muted-foreground ml-1">({gymReviews.length} hodnocení)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {canEdit && (
                        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openEdit(gym)}>
                          <Pencil className="h-3 w-3" /> Upravit
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(gym.id)} aria-label="Odebrat pobočku">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {gym.description && (
                    <p className="text-sm text-muted-foreground mt-3">{gym.description}</p>
                  )}

                  {gym.equipment?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {gym.equipment.map(a => (
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
                              <span className="text-sm font-medium text-foreground">{r.authorName}</span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <Star key={i} className={`h-3 w-3 ${i <= r.rating ? "fill-warning text-warning" : "text-border"}`} />
                                ))}
                              </div>
                            </div>
                            {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                            <p className="text-xs text-muted-foreground/60 mt-1">{new Date(r.created_at).toLocaleDateString("cs-CZ")}</p>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGym ? "Upravit pobočku" : "Přidat novou pobočku"}</DialogTitle>
          </DialogHeader>
          {!editingGym && (
            <div className="grid gap-2 pt-2">
              <Label>Najít existující posilovnu</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Název nebo město…" className="pl-8" maxLength={100} />
              </div>
              {q && (
                searchResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nic nenalezeno – vytvoř novou pobočku níže.</p>
                ) : (
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {searchResults.map(g => (
                      <div key={g.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{[g.address, g.city].filter(Boolean).join(", ")}</p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1 text-xs shrink-0" disabled={saving} onClick={() => linkGym(g.id)}>
                          <Link2 className="h-3 w-3" /> Přidat
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              )}
              <p className="text-xs font-medium text-muted-foreground pt-3 mt-1 border-t border-border">Nebo vytvoř novou</p>
            </div>
          )}
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Název posilovny *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="FitZone Praha" maxLength={100} />
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
            <Button onClick={handleSave} disabled={saving}>{editingGym ? "Uložit změny" : "Přidat pobočku"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
