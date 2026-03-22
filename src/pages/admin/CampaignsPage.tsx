import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Gift, Users, Target, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface Partner { id: string; name: string; }
interface Campaign {
  id: string; partner_id: string; title: string; description: string | null;
  target_group: string; reward_type: string; reward_value: string;
  promo_code: string | null; goal_type: string; goal_value: number | null;
  valid_from: string | null; valid_to: string | null;
  requires_approval: boolean; active: boolean; created_at: string;
  partners?: { name: string } | null;
}

const TARGET_LABELS: Record<string, string> = { coach: "Trenéři", client: "Klienti", both: "Oba" };
const REWARD_LABELS: Record<string, string> = { percentage: "% sleva", fixed: "Fixní benefit", promo_code: "Promo kód" };
const GOAL_LABELS: Record<string, string> = { attendance: "Docházka", plan_completion: "Dokončení plánu", course_completion: "Dokončení kurzu", manual: "Ruční" };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [partnerId, setPartnerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetGroup, setTargetGroup] = useState("both");
  const [rewardType, setRewardType] = useState("percentage");
  const [rewardValue, setRewardValue] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [goalType, setGoalType] = useState("manual");
  const [goalValue, setGoalValue] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);

  const fetch = async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("promo_campaigns").select("*, partners(name)").order("created_at", { ascending: false }),
      supabase.from("partners").select("id, name").eq("active", true).order("name"),
    ]);
    if (c) setCampaigns(c as Campaign[]);
    if (p) setPartners(p);
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => {
    setPartnerId(""); setTitle(""); setDescription(""); setTargetGroup("both");
    setRewardType("percentage"); setRewardValue(""); setPromoCode("");
    setGoalType("manual"); setGoalValue(""); setValidFrom(""); setValidTo("");
    setRequiresApproval(false);
  };

  const handleSave = async () => {
    if (!partnerId || !title.trim()) { toast.error("Vyplňte partnera a název"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("promo_campaigns").insert({
      partner_id: partnerId,
      title: title.trim(),
      description: description.trim(),
      target_group: targetGroup,
      reward_type: rewardType,
      reward_value: rewardValue.trim(),
      promo_code: promoCode.trim() || null,
      goal_type: goalType,
      goal_value: goalValue ? parseInt(goalValue) : 0,
      valid_from: validFrom || null,
      valid_to: validTo || null,
      requires_approval: requiresApproval,
      created_by: user?.id,
    });
    if (error) { toast.error("Chyba při vytváření"); console.error(error); }
    else { toast.success("Promo akce vytvořena"); resetForm(); setShowDialog(false); }
    setSaving(false);
    fetch();
  };

  const toggleActive = async (c: Campaign) => {
    await supabase.from("promo_campaigns").update({ active: !c.active }).eq("id", c.id);
    fetch();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Promo akce" description="Správa partnerských promo akcí a výzev">
        <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-3.5 w-3.5" /> Nová akce
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {campaigns.map(c => (
          <div key={c.id} className="rounded-xl bg-card shadow-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                  <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Aktivní" : "Neaktivní"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{c.partners?.name}</p>
                {c.description && <p className="text-xs text-muted-foreground mb-3">{c.description}</p>}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md">
                    <Users className="h-3 w-3" /> {TARGET_LABELS[c.target_group]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md">
                    <Gift className="h-3 w-3" /> {REWARD_LABELS[c.reward_type]}: {c.reward_value}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md">
                    <Target className="h-3 w-3" /> {GOAL_LABELS[c.goal_type]} {c.goal_value ? `(${c.goal_value})` : ""}
                  </span>
                  {c.valid_from && (
                    <span className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md">
                      <Calendar className="h-3 w-3" /> {format(new Date(c.valid_from), "d.M.yyyy")} – {c.valid_to ? format(new Date(c.valid_to), "d.M.yyyy") : "∞"}
                    </span>
                  )}
                  {c.promo_code && (
                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded-md">{c.promo_code}</span>
                  )}
                </div>
              </div>
              <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Zatím žádné promo akce.</p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nová promo akce</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Partner *</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger><SelectValue placeholder="Vyberte partnera" /></SelectTrigger>
                <SelectContent>
                  {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Název akce *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="např. USN trenérská sleva" />
            </div>
            <div>
              <Label>Popis</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Popis promo akce..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cílová skupina</Label>
                <Select value={targetGroup} onValueChange={setTargetGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach">Trenéři</SelectItem>
                    <SelectItem value="client">Klienti</SelectItem>
                    <SelectItem value="both">Oba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Typ odměny</Label>
                <Select value={rewardType} onValueChange={setRewardType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">% sleva</SelectItem>
                    <SelectItem value="fixed">Fixní benefit</SelectItem>
                    <SelectItem value="promo_code">Promo kód</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hodnota odměny</Label>
                <Input value={rewardValue} onChange={e => setRewardValue(e.target.value)} placeholder="např. 5%" />
              </div>
              <div>
                <Label>Promo kód</Label>
                <Input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="např. USN2026" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Typ cíle</Label>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendance">Docházka</SelectItem>
                    <SelectItem value="plan_completion">Dokončení plánu</SelectItem>
                    <SelectItem value="course_completion">Dokončení kurzu</SelectItem>
                    <SelectItem value="manual">Ruční schválení</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cílová hodnota</Label>
                <Input type="number" value={goalValue} onChange={e => setGoalValue(e.target.value)} placeholder="např. 8" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Platnost od</Label>
                <Input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
              </div>
              <div>
                <Label>Platnost do</Label>
                <Input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
              <Label>Vyžaduje schválení adminem</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Zrušit</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Ukládám..." : "Vytvořit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}