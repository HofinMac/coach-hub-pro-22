import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/use-current-profile";
import { from, initialsOf, type GymRow, type GymReviewRow } from "@/lib/db";
import { MapPin, Clock, Star, User, Dumbbell } from "lucide-react";
import { toast } from "sonner";

function StarSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5" aria-label={`${i} z 5`}>
          <Star className={`h-6 w-6 transition-colors ${i <= value ? "fill-warning text-warning" : "text-border hover:text-warning/50"}`} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${h} ${i <= Math.round(rating) ? "fill-warning text-warning" : "text-border"}`} />
      ))}
      <span className={`font-medium text-muted-foreground ml-1 ${size === "sm" ? "text-xs" : "text-sm"}`}>{rating.toFixed(1)}</span>
    </div>
  );
}

async function fetchCoachGymsForClient(coachId: string, myId: string, myName: string) {
  const [{ data: coach }, { data: links, error }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, specialties, bio").eq("id", coachId).maybeSingle(),
    from("coach_gyms").select("gym_id, gyms(*)").eq("coach_id", coachId),
  ]);
  if (error) throw error;
  const gyms = ((links ?? []) as { gyms: GymRow | null }[])
    .map(l => l.gyms)
    .filter((g): g is GymRow => !!g)
    .sort((a, b) => a.name.localeCompare(b.name, "cs"));

  let reviews: (GymReviewRow & { authorName: string })[] = [];
  if (gyms.length > 0) {
    const { data, error: revErr } = await from("gym_reviews")
      .select("*")
      .in("gym_id", gyms.map(g => g.id))
      .order("created_at", { ascending: false });
    if (revErr) throw revErr;
    // Clients can't read other clients' profiles, so only own reviews get a name.
    reviews = ((data ?? []) as GymReviewRow[]).map(r => ({
      ...r,
      authorName: r.author_id === myId ? `${myName || "Ty"} (ty)` : r.author_id === coachId ? coach?.full_name || "Trenér" : "Klient",
    }));
  }
  return { coach, gyms, reviews };
}

export default function ClientGymsPage() {
  const queryClient = useQueryClient();
  const { profile, isLoading: profileLoading } = useCurrentProfile();
  const coachId = profile?.assigned_coach_id ?? null;
  const queryKey = ["client-gyms", coachId];
  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!profile && !!coachId,
    queryFn: () => fetchCoachGymsForClient(coachId!, profile!.id, profile!.full_name),
  });

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedGym, setExpandedGym] = useState<string | null>(null);

  const reviews = data?.reviews ?? [];
  const myReview = (gymId: string) => reviews.find(r => r.gym_id === gymId && r.author_id === profile?.id);

  const openReview = (gym: GymRow) => {
    const existing = myReview(gym.id);
    setReviewTarget({ id: gym.id, name: gym.name });
    setReviewRating(existing?.rating ?? 0);
    setReviewComment(existing?.comment ?? "");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) { toast.error("Vyber počet hvězdiček."); return; }
    if (!reviewTarget || !profile) return;
    setSaving(true);
    const { error } = await from("gym_reviews").upsert(
      { gym_id: reviewTarget.id, author_id: profile.id, rating: reviewRating, comment: reviewComment.trim() },
      { onConflict: "gym_id,author_id" },
    );
    setSaving(false);
    if (error) { toast.error("Hodnocení se nepodařilo uložit."); return; }
    toast.success("Hodnocení odesláno! Děkujeme.");
    setReviewDialogOpen(false);
    queryClient.invalidateQueries({ queryKey });
  };

  const loading = profileLoading || (!!coachId && isLoading);
  const coach = data?.coach;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Posilovny a trenéři" description="Posilovny, kde trénuje tvůj trenér. Ohodnoť je." />

      {loading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Načítám posilovny…</p>
      ) : !coachId ? (
        <div className="rounded-xl bg-card shadow-card p-12 text-center">
          <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Zatím nemáš přiřazeného trenéra.</p>
        </div>
      ) : (
        <>
          {coach && (
            <>
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Tvůj trenér
              </h2>
              <div className="rounded-xl bg-card shadow-card p-5 mb-8 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                  {initialsOf(coach.full_name)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{coach.full_name}</h3>
                  {coach.specialties && coach.specialties.length > 0 && (
                    <p className="text-xs text-muted-foreground">{coach.specialties.join(", ")}</p>
                  )}
                  {coach.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{coach.bio}</p>}
                </div>
              </div>
            </>
          )}

          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Posilovny tvého trenéra
          </h2>
          {(data?.gyms ?? []).length === 0 ? (
            <div className="rounded-xl bg-card shadow-card p-12 text-center">
              <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Tvůj trenér zatím nepřidal žádnou posilovnu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(data?.gyms ?? []).map(gym => {
                const gymReviews = reviews.filter(r => r.gym_id === gym.id);
                const avg = gymReviews.length > 0 ? gymReviews.reduce((s, r) => s + r.rating, 0) / gymReviews.length : 0;
                const isExpanded = expandedGym === gym.id;
                const reviewed = !!myReview(gym.id);

                return (
                  <div key={gym.id} className="rounded-xl bg-card shadow-card overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
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
                          <div className="mt-2">
                            {gymReviews.length > 0 ? (
                              <>
                                <StarDisplay rating={avg} />
                                <span className="text-xs text-muted-foreground ml-1">({gymReviews.length} hodnocení)</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Zatím bez hodnocení</span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs shrink-0" onClick={() => openReview(gym)}>
                          <Star className="h-3 w-3" /> {reviewed ? "Upravit hodnocení" : "Ohodnotit"}
                        </Button>
                      </div>

                      {gym.description && <p className="text-sm text-muted-foreground mt-3">{gym.description}</p>}

                      {gym.equipment?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {gym.equipment.map(a => (
                            <span key={a} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>

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
                                  <StarDisplay rating={r.rating} />
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
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ohodnotit: {reviewTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Hodnocení *</Label>
              <StarSelect value={reviewRating} onChange={setReviewRating} />
            </div>
            <div className="grid gap-1.5">
              <Label>Komentář (nepovinný)</Label>
              <Textarea
                value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                placeholder="Napiš svůj názor..." maxLength={300} className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Zrušit</Button></DialogClose>
            <Button onClick={handleSubmitReview} disabled={saving}>Odeslat hodnocení</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
