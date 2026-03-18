import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { gyms, getReviewsForTarget, getAverageRating, type Gym, type Review } from "@/lib/gym-data";
import { coaches } from "@/lib/demo-data";
import { MapPin, Clock, Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const CLIENT_ID = "cl2";

function StarSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5">
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

export default function ClientGymsPage() {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ type: "gym" | "coach"; id: string; name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [localReviews, setLocalReviews] = useState<Review[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const openReview = (type: "gym" | "coach", id: string, name: string) => {
    setReviewTarget({ type, id, name });
    setReviewRating(0);
    setReviewComment("");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (reviewRating === 0) { toast.error("Vyber počet hvězdiček."); return; }
    if (!reviewTarget) return;
    const newReview: Review = {
      id: `r_new_${Date.now()}`, targetType: reviewTarget.type, targetId: reviewTarget.id,
      clientId: CLIENT_ID, clientName: "Elena Voss", rating: reviewRating,
      comment: reviewComment.trim(), createdAt: new Date().toISOString().split("T")[0],
    };
    setLocalReviews(prev => [newReview, ...prev]);
    toast.success("Hodnocení odesláno! Děkujeme.");
    setReviewDialogOpen(false);
  };

  const allReviews = (type: "gym" | "coach", id: string) => {
    return [...localReviews.filter(r => r.targetType === type && r.targetId === id), ...getReviewsForTarget(type, id)];
  };

  // Coaches relevant to this client
  const relevantCoaches = coaches.filter(c => c.id === "c1");

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader title="Posilovny a trenéři" description="Vyber si gym a ohodnoť trenéra i posilovnu." />

      {/* Gyms */}
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" /> Dostupné posilovny
      </h2>
      <div className="space-y-4 mb-8">
        {gyms.map(gym => {
          const gymReviews = allReviews("gym", gym.id);
          const avg = gymReviews.length > 0
            ? gymReviews.reduce((s, r) => s + r.rating, 0) / gymReviews.length
            : gym.rating;
          const isExpanded = expandedSection === `gym-${gym.id}`;

          return (
            <div key={gym.id} className="rounded-xl bg-card shadow-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{gym.name}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {gym.address}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {gym.openingHours}
                      </span>
                    </div>
                    <div className="mt-2">
                      <StarDisplay rating={avg} />
                      <span className="text-xs text-muted-foreground ml-1">({gymReviews.length} hodnocení)</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openReview("gym", gym.id, gym.name)}>
                    <Star className="h-3 w-3" /> Ohodnotit
                  </Button>
                </div>

                {gym.description && <p className="text-sm text-muted-foreground mt-3">{gym.description}</p>}

                {gym.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {gym.amenities.map(a => (
                      <span key={a} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{a}</span>
                    ))}
                  </div>
                )}
              </div>

              {gymReviews.length > 0 && (
                <div className="border-t border-border">
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : `gym-${gym.id}`)}
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
                            <StarDisplay rating={r.rating} />
                          </div>
                          {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
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

      {/* Coach ratings */}
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" /> Tvoji trenéři
      </h2>
      <div className="space-y-3">
        {relevantCoaches.map(coach => {
          const coachReviews = allReviews("coach", coach.id);
          const avg = coachReviews.length > 0
            ? coachReviews.reduce((s, r) => s + r.rating, 0) / coachReviews.length
            : 0;
          const isExpanded = expandedSection === `coach-${coach.id}`;

          return (
            <div key={coach.id} className="rounded-xl bg-card shadow-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {coach.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{coach.name}</h3>
                      <p className="text-xs text-muted-foreground">{coach.specialties.join(", ")}</p>
                      {avg > 0 && (
                        <div className="mt-1">
                          <StarDisplay rating={avg} />
                          <span className="text-xs text-muted-foreground ml-1">({coachReviews.length})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openReview("coach", coach.id, coach.name)}>
                    <Star className="h-3 w-3" /> Ohodnotit
                  </Button>
                </div>
              </div>

              {coachReviews.length > 0 && (
                <div className="border-t border-border">
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : `coach-${coach.id}`)}
                    className="w-full px-5 py-2.5 text-left text-xs font-medium text-muted-foreground hover:bg-subtle transition-colors"
                  >
                    {isExpanded ? "Skrýt" : "Zobrazit"} hodnocení ({coachReviews.length})
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-3">
                      {coachReviews.map(r => (
                        <div key={r.id} className="rounded-lg bg-subtle p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{r.clientName}</span>
                            <StarDisplay rating={r.rating} />
                          </div>
                          {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
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
            <Button onClick={handleSubmitReview}>Odeslat hodnocení</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
