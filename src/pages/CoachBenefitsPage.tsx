import { useEffect, useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Upload, CheckCircle2, Clock, XCircle, FileText, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { evaluateEligibility, logAuditEvent } from "@/lib/partner-engine";

interface Certificate {
  id: string; status: string; certificate_url: string; created_at: string; notes: string | null;
}

interface Benefit {
  id: string; status: string; promo_code: string | null; valid_until: string | null; created_at: string;
  promo_campaigns?: { title: string; description: string | null; reward_type: string; reward_value: string; partners?: { name: string; logo_url: string | null } | null } | null;
}

interface Campaign {
  id: string; title: string; description: string | null; reward_value: string; goal_type: string;
  partners?: { name: string; logo_url: string | null } | null;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  approved: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  rejected: <XCircle className="h-4 w-4 text-destructive" />,
  expired: <Clock className="h-4 w-4 text-muted-foreground" />,
};
const STATUS_LABELS: Record<string, string> = { pending: "Čeká na schválení", approved: "Schváleno", rejected: "Zamítnuto", expired: "Expirováno" };
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline", approved: "default", rejected: "destructive", expired: "secondary"
};

export default function CoachBenefitsPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [{ data: certs }, { data: bens }, { data: camps }] = await Promise.all([
      supabase.from("coach_certificates").select("*").eq("coach_id", user.id).order("created_at", { ascending: false }),
      supabase.from("coach_benefits").select("*, promo_campaigns(title, description, reward_type, reward_value, partners(name, logo_url))").eq("coach_id", user.id).order("created_at", { ascending: false }),
      supabase.from("promo_campaigns").select("id, title, description, reward_value, goal_type, partners(name, logo_url)").eq("active", true).in("target_group", ["coach", "both"]).eq("goal_type", "course_completion"),
    ]);
    if (certs) setCertificates(certs as Certificate[]);
    if (bens) setBenefits(bens as Benefit[]);
    if (camps) setAvailableCampaigns(camps as Campaign[]);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUploadCert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    const path = `${userId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("certificates").upload(path, file);
    if (upErr) { toast.error("Chyba při nahrávání"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(path);
    const { error } = await supabase.from("coach_certificates").insert({
      coach_id: userId, certificate_url: urlData.publicUrl
    });
    if (error) toast.error("Chyba při ukládání"); else toast.success("Certifikát nahrán a čeká na schválení");
    setUploading(false);
    fetchData();
  };

  const handleRequestBenefit = async (campaignId: string) => {
    if (!userId) return;
    const hasCert = certificates.some(c => c.status === "approved");
    if (!hasCert) { toast.error("Nejdříve musíte mít schválený certifikát"); return; }
    const { error } = await supabase.from("coach_benefits").insert({
      campaign_id: campaignId, coach_id: userId
    });
    if (error) {
      if (error.code === "23505") toast.info("O tento benefit jste již požádali");
      else toast.error("Chyba při žádosti");
    } else toast.success("Žádost odeslána");
    fetchData();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kód zkopírován");
  };

  const hasCertApproved = certificates.some(c => c.status === "approved");
  const activeBenefits = benefits.filter(b => b.status === "approved");
  const requestedCampaignIds = new Set(benefits.map(b => b.promo_campaigns?.title));

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Partnerské benefity" description="Vaše slevy a výhody od partnerů" />

      {/* Certificate section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Certifikát kurzu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Pro získání partnerských benefitů je nutné nahrát certifikát o dokončení kurzu.
              </p>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUploadCert} />
              <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
                <Upload className="h-3.5 w-3.5" /> {uploading ? "Nahrávám..." : "Nahrát certifikát"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {certificates.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-subtle">
                  <div className="flex items-center gap-3">
                    {STATUS_ICONS[c.status]}
                    <div>
                      <p className="text-sm font-medium text-foreground">{STATUS_LABELS[c.status]}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(c.created_at), "d. MMM yyyy", { locale: cs })}</p>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                </div>
              ))}
              {!hasCertApproved && (
                <div className="pt-2">
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUploadCert} />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Nahrát nový
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active benefits */}
      {activeBenefits.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Aktivní benefity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBenefits.map(b => (
              <Card key={b.id} className="border-primary/20 bg-primary/5">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.promo_campaigns?.title}</p>
                      <p className="text-xs text-muted-foreground">{b.promo_campaigns?.partners?.name}</p>
                    </div>
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-primary mb-1">{b.promo_campaigns?.reward_value}</p>
                  {b.promo_code && (
                    <button onClick={() => copyCode(b.promo_code!)} className="flex items-center gap-2 mt-2 bg-background rounded-lg px-3 py-2 text-sm font-mono border border-border hover:bg-accent transition-colors">
                      <span>{b.promo_code}</span>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                  {b.valid_until && (
                    <p className="text-xs text-muted-foreground mt-2">Platnost do: {format(new Date(b.valid_until), "d. MMM yyyy", { locale: cs })}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available campaigns */}
      {hasCertApproved && availableCampaigns.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Dostupné akce</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCampaigns.map(c => {
              const alreadyRequested = benefits.some(b => b.promo_campaigns?.title === c.title);
              return (
                <Card key={c.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.partners?.name}</p>
                      </div>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mb-3">{c.description}</p>}
                    <p className="text-sm font-medium text-primary mb-3">Odměna: {c.reward_value}</p>
                    <Button size="sm" disabled={alreadyRequested} onClick={() => handleRequestBenefit(c.id)} className="gap-1.5">
                      {alreadyRequested ? "Požádáno" : "Požádat o benefit"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      {benefits.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Historie benefitů</h2>
          <div className="rounded-xl bg-card shadow-card overflow-hidden">
            <div className="divide-y divide-border">
              {benefits.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.promo_campaigns?.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(b.created_at), "d. MMM yyyy", { locale: cs })}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}