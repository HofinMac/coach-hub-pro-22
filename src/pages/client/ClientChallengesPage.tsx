import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, Copy, CheckCircle2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface Challenge {
  id: string; current_progress: number; goal_target: number; status: string;
  completed_at: string | null; promo_code: string | null; created_at: string;
  promo_campaigns?: {
    title: string; description: string | null; reward_type: string; reward_value: string;
    promo_code: string | null; valid_from: string | null; valid_to: string | null;
    partners?: { name: string; logo_url: string | null } | null;
  } | null;
}

interface RewardItem {
  id: string; reward_type: string; reward_value: string; promo_code: string | null;
  redeemed: boolean; created_at: string;
  promo_campaigns?: { title: string; partners?: { name: string } | null } | null;
}

interface AvailableCampaign {
  id: string; title: string; description: string | null; reward_value: string;
  goal_type: string; goal_value: number | null;
  valid_from: string | null; valid_to: string | null;
  partners?: { name: string; logo_url: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = { active: "Probíhá", completed: "Splněno", expired: "Expirováno", claimed: "Uplatněno" };
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "outline", completed: "default", expired: "secondary", claimed: "default"
};

export default function ClientChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<AvailableCampaign[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [{ data: ch }, { data: rw }, { data: camps }] = await Promise.all([
      supabase.from("client_challenges").select("*, promo_campaigns(title, description, reward_type, reward_value, promo_code, valid_from, valid_to, partners(name, logo_url))").eq("client_id", user.id).order("created_at", { ascending: false }),
      supabase.from("reward_history").select("*, promo_campaigns(title, partners(name))").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("promo_campaigns").select("id, title, description, reward_value, goal_type, goal_value, valid_from, valid_to, partners(name, logo_url)").eq("active", true).in("target_group", ["client", "both"]),
    ]);
    if (ch) setChallenges(ch as Challenge[]);
    if (rw) setRewards(rw as RewardItem[]);
    if (camps) setAvailableCampaigns(camps as AvailableCampaign[]);
  };

  useEffect(() => { fetchData(); }, []);

  const handleJoin = async (campaign: AvailableCampaign) => {
    if (!userId) return;
    const { error } = await supabase.from("client_challenges").insert({
      campaign_id: campaign.id,
      client_id: userId,
      goal_target: campaign.goal_value || 0,
    });
    if (error) {
      if (error.code === "23505") toast.info("Tuto výzvu již plníte");
      else toast.error("Chyba");
    } else toast.success("Výzva přijata!");
    fetchData();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kód zkopírován");
  };

  const activeChallenges = challenges.filter(c => c.status === "active");
  const completedChallenges = challenges.filter(c => c.status === "completed" || c.status === "claimed");
  const joinedCampaignIds = new Set(challenges.map(c => c.promo_campaigns?.title));

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Výzvy a odměny" description="Plňte výzvy a získávejte slevy od partnerů" />

      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Aktivní výzvy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeChallenges.map(ch => {
              const pct = ch.goal_target > 0 ? Math.min(100, Math.round((ch.current_progress / ch.goal_target) * 100)) : 0;
              return (
                <Card key={ch.id} className="overflow-hidden">
                  <div className="h-1 bg-primary" style={{ width: `${pct}%`, transition: "width 0.5s ease" }} />
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ch.promo_campaigns?.title}</p>
                        <p className="text-xs text-muted-foreground">{ch.promo_campaigns?.partners?.name}</p>
                      </div>
                      <Badge variant="outline">Probíhá</Badge>
                    </div>
                    {ch.promo_campaigns?.description && (
                      <p className="text-xs text-muted-foreground my-2">{ch.promo_campaigns.description}</p>
                    )}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-foreground">{ch.current_progress} / {ch.goal_target}</span>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2.5" />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
                      <Gift className="h-3.5 w-3.5" /> Odměna: {ch.promo_campaigns?.reward_value}
                    </div>
                    {ch.promo_campaigns?.valid_to && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Do: {format(new Date(ch.promo_campaigns.valid_to), "d. MMM yyyy", { locale: cs })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed with rewards */}
      {completedChallenges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" /> Splněné výzvy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedChallenges.map(ch => (
              <Card key={ch.id} className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ch.promo_campaigns?.title}</p>
                      <p className="text-xs text-muted-foreground">{ch.promo_campaigns?.partners?.name}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm font-bold text-primary mb-1">{ch.promo_campaigns?.reward_value}</p>
                  {ch.promo_code && (
                    <button onClick={() => copyCode(ch.promo_code!)} className="flex items-center gap-2 mt-2 bg-background rounded-lg px-3 py-2 text-sm font-mono border border-border hover:bg-accent transition-colors">
                      <span>{ch.promo_code}</span>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available campaigns to join */}
      {availableCampaigns.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">Dostupné výzvy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCampaigns.map(c => {
              const alreadyJoined = challenges.some(ch => ch.promo_campaigns?.title === c.title);
              return (
                <Card key={c.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.partners?.name}</p>
                      </div>
                      {c.partners?.logo_url && (
                        <img src={c.partners.logo_url} alt="" className="h-8 w-8 rounded object-contain" />
                      )}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mb-2">{c.description}</p>}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md">
                        Cíl: {c.goal_value} {c.goal_type === "attendance" ? "tréninků" : ""}
                      </span>
                      <span className="text-xs text-primary font-medium">Odměna: {c.reward_value}</span>
                    </div>
                    {c.valid_from && c.valid_to && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {format(new Date(c.valid_from), "d.M.")} – {format(new Date(c.valid_to), "d.M.yyyy")}
                      </p>
                    )}
                    <Button size="sm" disabled={alreadyJoined} onClick={() => handleJoin(c)}>
                      {alreadyJoined ? "Již zapojeno" : "Přijmout výzvu"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Reward history */}
      {rewards.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Historie odměn</h2>
          <div className="rounded-xl bg-card shadow-card overflow-hidden divide-y divide-border">
            {rewards.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 px-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.promo_campaigns?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.promo_campaigns?.partners?.name} · {format(new Date(r.created_at), "d. MMM yyyy", { locale: cs })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">{r.reward_value}</p>
                  {r.promo_code && <p className="text-xs font-mono text-muted-foreground">{r.promo_code}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {challenges.length === 0 && availableCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Momentálně nejsou žádné aktivní výzvy.</p>
        </div>
      )}
    </div>
  );
}