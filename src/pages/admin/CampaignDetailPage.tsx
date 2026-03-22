import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowLeft, Code, Shield, ScrollText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { RULE_TYPE_LABELS, OPERATOR_LABELS, logAuditEvent, type RuleType, type Operator } from "@/lib/partner-engine";

interface Campaign {
  id: string; title: string; description: string | null; target_group: string;
  reward_type: string; reward_value: string; promo_code: string | null;
  goal_type: string; goal_value: number | null; valid_from: string | null;
  valid_to: string | null; requires_approval: boolean; active: boolean;
  partner_id: string; created_at: string;
  partners?: { name: string } | null;
}

interface Rule {
  id: string; campaign_id: string; rule_type: string; operator: string;
  threshold: number; metric_key: string; description: string; created_at: string;
}

interface PromoCode {
  id: string; campaign_id: string; code: string; max_uses: number | null;
  current_uses: number; assigned_to: string | null; is_personal: boolean;
  active: boolean; expires_at: string | null; created_at: string;
}

interface Redemption {
  id: string; user_id: string; campaign_id: string; redeemed_at: string;
  source: string; notes: string | null;
  promo_codes?: { code: string } | null;
}

interface AuditEntry {
  id: string; entity_type: string; action: string; created_at: string;
  old_values: Record<string, unknown>; new_values: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  // Rule form
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [ruleType, setRuleType] = useState<string>("min_attendance");
  const [ruleOperator, setRuleOperator] = useState<string>("gte");
  const [ruleThreshold, setRuleThreshold] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");

  // Code form
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [codeMaxUses, setCodeMaxUses] = useState("");
  const [codeExpires, setCodeExpires] = useState("");
  const [codePersonal, setCodePersonal] = useState(false);

  const fetchAll = async () => {
    if (!id) return;
    const [{ data: c }, { data: r }, { data: p }, { data: red }, { data: audit }] = await Promise.all([
      supabase.from("promo_campaigns").select("*, partners(name)").eq("id", id).single(),
      supabase.from("campaign_rules").select("*").eq("campaign_id", id).order("created_at"),
      supabase.from("promo_codes").select("*").eq("campaign_id", id).order("created_at", { ascending: false }),
      supabase.from("redemptions").select("*, promo_codes(code)").eq("campaign_id", id).order("redeemed_at", { ascending: false }),
      supabase.from("partner_audit_log").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
    ]);
    if (c) setCampaign(c as Campaign);
    if (r) setRules(r as Rule[]);
    if (p) setCodes(p as PromoCode[]);
    if (red) setRedemptions(red as Redemption[]);
    if (audit) setAuditLog(audit as AuditEntry[]);
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleAddRule = async () => {
    if (!id || !ruleThreshold) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("campaign_rules").insert([{
      campaign_id: id, rule_type: ruleType, operator: ruleOperator,
      threshold: parseInt(ruleThreshold), description: ruleDesc.trim(),
    }]);
    if (error) toast.error("Chyba"); else {
      toast.success("Pravidlo přidáno");
      if (user) await logAuditEvent({ entityType: "rule", entityId: id, action: "created", actorId: user.id, newValues: { rule_type: ruleType, threshold: ruleThreshold } });
    }
    setShowRuleDialog(false);
    setRuleType("min_attendance"); setRuleOperator("gte"); setRuleThreshold(""); setRuleDesc("");
    fetchAll();
  };

  const handleDeleteRule = async (ruleId: string) => {
    await supabase.from("campaign_rules").delete().eq("id", ruleId);
    toast.success("Pravidlo odstraněno");
    fetchAll();
  };

  const handleAddCode = async () => {
    if (!id || !codeValue.trim()) return;
    const { error } = await supabase.from("promo_codes").insert([{
      campaign_id: id, code: codeValue.trim().toUpperCase(),
      max_uses: codeMaxUses ? parseInt(codeMaxUses) : null,
      expires_at: codeExpires || null, is_personal: codePersonal,
    }]);
    if (error) {
      if (error.code === "23505") toast.error("Tento kód už existuje");
      else toast.error("Chyba");
    } else toast.success("Kód přidán");
    setShowCodeDialog(false);
    setCodeValue(""); setCodeMaxUses(""); setCodeExpires(""); setCodePersonal(false);
    fetchAll();
  };

  const toggleCodeActive = async (c: PromoCode) => {
    await supabase.from("promo_codes").update({ active: !c.active }).eq("id", c.id);
    fetchAll();
  };

  if (!campaign) return <div className="p-6">Načítání...</div>;

  const REWARD_LABELS: Record<string, string> = { percentage: "% sleva", fixed: "Fixní benefit", promo_code: "Promo kód" };
  const TARGET_LABELS: Record<string, string> = { coach: "Trenéři", client: "Klienti", both: "Oba" };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <Link to="/admin/campaigns" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Zpět na promo akce
      </Link>

      <PageHeader title={campaign.title} description={`${campaign.partners?.name} · ${TARGET_LABELS[campaign.target_group]}`}>
        <Badge variant={campaign.active ? "default" : "secondary"}>{campaign.active ? "Aktivní" : "Neaktivní"}</Badge>
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Odměna</p>
            <p className="text-lg font-bold text-foreground">{campaign.reward_value}</p>
            <p className="text-xs text-muted-foreground">{REWARD_LABELS[campaign.reward_type]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Pravidla</p>
            <p className="text-lg font-bold text-foreground">{rules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Promo kódy</p>
            <p className="text-lg font-bold text-foreground">{codes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Uplatnění</p>
            <p className="text-lg font-bold text-foreground">{redemptions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="mb-4">
          <TabsTrigger value="rules" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Pravidla</TabsTrigger>
          <TabsTrigger value="codes" className="gap-1.5"><Code className="h-3.5 w-3.5" /> Promo kódy</TabsTrigger>
          <TabsTrigger value="redemptions" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Uplatnění</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><ScrollText className="h-3.5 w-3.5" /> Audit log</TabsTrigger>
        </TabsList>

        {/* Rules tab */}
        <TabsContent value="rules">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Pravidla kampaně</h3>
            <Button size="sm" className="gap-1.5" onClick={() => setShowRuleDialog(true)}>
              <Plus className="h-3.5 w-3.5" /> Přidat pravidlo
            </Button>
          </div>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Žádná pravidla – kampaň je přístupná všem.</p>
          ) : (
            <div className="space-y-2">
              {rules.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {RULE_TYPE_LABELS[r.rule_type as RuleType] || r.rule_type} {OPERATOR_LABELS[r.operator as Operator] || r.operator} {r.threshold}
                    </p>
                    {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRule(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Promo codes tab */}
        <TabsContent value="codes">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Promo kódy</h3>
            <Button size="sm" className="gap-1.5" onClick={() => setShowCodeDialog(true)}>
              <Plus className="h-3.5 w-3.5" /> Přidat kód
            </Button>
          </div>
          {codes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Žádné promo kódy.</p>
          ) : (
            <div className="rounded-xl bg-card shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-subtle">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Kód</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Využití</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Typ</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Expirace</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Stav</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {codes.map(c => (
                    <tr key={c.id} className="hover:bg-subtle transition-colors">
                      <td className="px-4 py-3 font-mono text-sm font-medium text-foreground">{c.code}</td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {c.current_uses}{c.max_uses ? ` / ${c.max_uses}` : " / ∞"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary">{c.is_personal ? "Osobní" : "Veřejný"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {c.expires_at ? format(new Date(c.expires_at), "d.M.yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Aktivní" : "Neaktivní"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Switch checked={c.active} onCheckedChange={() => toggleCodeActive(c)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Redemptions tab */}
        <TabsContent value="redemptions">
          {redemptions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Zatím žádná uplatnění.</p>
          ) : (
            <div className="rounded-xl bg-card shadow-card overflow-hidden divide-y divide-border">
              {redemptions.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Kód: {r.promo_codes?.code || "—"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.redeemed_at), "d. MMM yyyy HH:mm", { locale: cs })}</p>
                  </div>
                  <Badge variant="outline">{r.source}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Audit log tab */}
        <TabsContent value="audit">
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Žádné záznamy.</p>
          ) : (
            <div className="space-y-1">
              {auditLog.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2 px-3 rounded-lg hover:bg-subtle text-xs">
                  <span className="text-muted-foreground w-28 shrink-0">{format(new Date(a.created_at), "d.M. HH:mm")}</span>
                  <Badge variant="outline" className="text-[10px]">{a.entity_type}</Badge>
                  <span className="font-medium text-foreground">{a.action}</span>
                  {Object.keys(a.new_values).length > 0 && (
                    <span className="text-muted-foreground truncate">{JSON.stringify(a.new_values)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Přidat pravidlo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Typ pravidla</Label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Operátor</Label>
                <Select value={ruleOperator} onValueChange={setRuleOperator}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATOR_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hodnota</Label>
                <Input type="number" value={ruleThreshold} onChange={e => setRuleThreshold(e.target.value)} placeholder="např. 8" />
              </div>
            </div>
            <div>
              <Label>Popis (volitelný)</Label>
              <Input value={ruleDesc} onChange={e => setRuleDesc(e.target.value)} placeholder="Minimálně 8 tréninků za měsíc" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>Zrušit</Button>
            <Button onClick={handleAddRule}>Přidat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Přidat promo kód</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kód *</Label>
              <Input value={codeValue} onChange={e => setCodeValue(e.target.value)} placeholder="např. USN2026" className="font-mono uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max. použití</Label>
                <Input type="number" value={codeMaxUses} onChange={e => setCodeMaxUses(e.target.value)} placeholder="∞" />
              </div>
              <div>
                <Label>Expirace</Label>
                <Input type="date" value={codeExpires} onChange={e => setCodeExpires(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={codePersonal} onCheckedChange={setCodePersonal} />
              <Label>Osobní kód (přidělit konkrétnímu uživateli)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeDialog(false)}>Zrušit</Button>
            <Button onClick={handleAddCode}>Přidat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}