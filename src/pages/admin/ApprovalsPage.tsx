import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface Certificate {
  id: string; coach_id: string; certificate_url: string; status: string;
  notes: string | null; created_at: string;
  profiles?: { full_name: string; email: string | null } | null;
}

interface BenefitRequest {
  id: string; campaign_id: string; coach_id: string; status: string;
  promo_code: string | null; created_at: string;
  profiles?: { full_name: string; email: string | null } | null;
  promo_campaigns?: { title: string; reward_value: string; promo_code: string | null } | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Čeká", variant: "outline" },
  approved: { label: "Schváleno", variant: "default" },
  rejected: { label: "Zamítnuto", variant: "destructive" },
};

export default function ApprovalsPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [benefits, setBenefits] = useState<BenefitRequest[]>([]);

  const fetchAll = async () => {
    const [{ data: certs }, { data: bens }] = await Promise.all([
      supabase.from("coach_certificates").select("*").order("created_at", { ascending: false }),
      supabase.from("coach_benefits").select("*, promo_campaigns(title, reward_value, promo_code)").order("created_at", { ascending: false }),
    ]);

    // Fetch profile names for coaches
    const coachIds = new Set<string>();
    certs?.forEach(c => coachIds.add(c.coach_id));
    bens?.forEach(b => coachIds.add(b.coach_id));
    
    const profileMap: Record<string, { full_name: string; email: string | null }> = {};
    if (coachIds.size > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", Array.from(coachIds));
      profiles?.forEach(p => { profileMap[p.id] = { full_name: p.full_name, email: p.email }; });
    }

    if (certs) setCertificates(certs.map(c => ({ ...c, profiles: profileMap[c.coach_id] || { full_name: "Neznámý", email: null } })) as Certificate[]);
    if (bens) setBenefits(bens.map(b => ({ ...b, profiles: profileMap[b.coach_id] || { full_name: "Neznámý", email: null } })) as BenefitRequest[]);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCertAction = async (id: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("coach_certificates").update({
      status, reviewed_by: user?.id, reviewed_at: new Date().toISOString()
    }).eq("id", id);
    if (error) toast.error("Chyba"); else toast.success(status === "approved" ? "Certifikát schválen" : "Certifikát zamítnut");
    fetchAll();
  };

  const handleBenefitAction = async (b: BenefitRequest, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    const updates: Record<string, unknown> = {
      status, approved_by: user?.id, approved_at: new Date().toISOString()
    };
    if (status === "approved" && b.promo_campaigns?.promo_code) {
      updates.promo_code = b.promo_campaigns.promo_code;
      updates.valid_until = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    }
    const { error } = await supabase.from("coach_benefits").update(updates).eq("id", b.id);
    if (error) toast.error("Chyba"); else {
      toast.success(status === "approved" ? "Benefit schválen" : "Benefit zamítnut");
      if (status === "approved") {
        await supabase.from("reward_history").insert({
          user_id: b.coach_id,
          campaign_id: b.campaign_id,
          reward_type: "promo_code",
          reward_value: b.promo_campaigns?.reward_value || "",
          promo_code: b.promo_campaigns?.promo_code || null,
        });
      }
    }
    fetchAll();
  };

  const pendingCerts = certificates.filter(c => c.status === "pending");
  const pendingBenefits = benefits.filter(b => b.status === "pending");

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Schvalování" description="Certifikáty trenérů a žádosti o benefity" />

      <Tabs defaultValue="certificates">
        <TabsList className="mb-4">
          <TabsTrigger value="certificates" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Certifikáty {pendingCerts.length > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{pendingCerts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="benefits" className="gap-1.5">
            Žádosti o benefit {pendingBenefits.length > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{pendingBenefits.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates">
          <div className="rounded-xl bg-card shadow-card overflow-hidden">
            {certificates.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Žádné certifikáty k posouzení.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-subtle">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Trenér</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Datum</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Stav</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {certificates.map(c => (
                    <tr key={c.id} className="hover:bg-subtle transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{c.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{c.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "d. MMM yyyy", { locale: cs })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={STATUS_MAP[c.status]?.variant || "secondary"}>{STATUS_MAP[c.status]?.label || c.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={c.certificate_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                          </a>
                          {c.status === "pending" && (
                            <>
                              <Button variant="outline" size="sm" className="gap-1 text-green-600" onClick={() => handleCertAction(c.id, "approved")}>
                                <Check className="h-3.5 w-3.5" /> Schválit
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => handleCertAction(c.id, "rejected")}>
                                <X className="h-3.5 w-3.5" /> Zamítnout
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="benefits">
          <div className="rounded-xl bg-card shadow-card overflow-hidden">
            {benefits.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Žádné žádosti o benefit.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-subtle">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Trenér</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Akce</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Stav</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {benefits.map(b => (
                    <tr key={b.id} className="hover:bg-subtle transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{b.profiles?.full_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{b.promo_campaigns?.title}</p>
                        <p className="text-xs text-muted-foreground">Odměna: {b.promo_campaigns?.reward_value}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={STATUS_MAP[b.status]?.variant || "secondary"}>{STATUS_MAP[b.status]?.label || b.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.status === "pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-1 text-green-600" onClick={() => handleBenefitAction(b, "approved")}>
                              <Check className="h-3.5 w-3.5" /> Schválit
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => handleBenefitAction(b, "rejected")}>
                              <X className="h-3.5 w-3.5" /> Zamítnout
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}