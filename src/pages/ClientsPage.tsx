import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Search, Copy, X, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";

interface ClientRow {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface InviteRow {
  id: string;
  email: string;
  token: string;
  created_at: string;
  email_sent_at: string | null;
}

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("") || "?";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: clientsData, error: clientsError }, { data: invitesData, error: invitesError }] = await Promise.all([
        supabase.from("profiles" as any).select("id, full_name, email, created_at").eq("assigned_coach_id", user.id),
        supabase.from("client_invites" as any).select("id, email, token, created_at, email_sent_at").eq("coach_id", user.id).eq("status", "pending"),
      ]);

      if (clientsError) throw clientsError;
      if (invitesError) throw invitesError;

      setClients((clientsData as any) || []);
      setInvites((invitesData as any) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setNewEmail("");
    setCreatedLink(null);
  };

  const handleAddClient = async () => {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      toast.error("Vyplňte platný e-mail");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("client_invites" as any)
        .insert({ coach_id: user.id, email: newEmail.trim() } as any)
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/register?invite=${(data as any).token}`;
      setCreatedLink(link);

      const { error: sendError } = await supabase.functions.invoke("send-invite", {
        body: { inviteId: (data as any).id },
      });

      if (sendError) {
        toast.error("Pozvánka vytvořena, e-mail se nepodařilo odeslat — pošlete odkaz ručně.");
      } else {
        toast.success("Pozvánka vytvořena a e-mail odeslán");
      }
      fetchData();
    } catch (err: any) {
      toast.error("Chyba: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success("Odkaz zkopírován");
  };

  const handleRevokeInvite = async (id: string) => {
    const { data, error } = await supabase
      .from("client_invites" as any)
      .update({ status: "revoked" } as any)
      .eq("id", id)
      .select();
    if (error) { toast.error("Chyba: " + error.message); return; }
    if (!data || (data as any[]).length === 0) {
      toast.error("Pozvánku se nepodařilo zrušit — zkuste obnovit stránku a zkusit to znovu.");
      fetchData();
      return;
    }
    toast.success("Pozvánka zrušena");
    fetchData();
  };

  const handleResendInvite = async (id: string) => {
    setResendingId(id);
    try {
      const { error } = await supabase.functions.invoke("send-invite", { body: { inviteId: id } });
      if (error) {
        toast.error("E-mail se nepodařilo odeslat. Zkuste to znovu nebo pošlete odkaz ručně.");
      } else {
        toast.success("E-mail odeslán");
      }
      fetchData();
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Klienti" description={`Celkem ${clients.length} klientů`}>
        <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <UserPlus className="h-3.5 w-3.5" /> Přidat klienta
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat klienty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {invites.length > 0 && (
        <div className="rounded-xl bg-card shadow-card overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-border bg-subtle">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Čekající pozvánky ({invites.length})</p>
          </div>
          <div className="divide-y divide-border">
            {invites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.email_sent_at
                      ? `E-mail odeslán ${format(parseISO(inv.email_sent_at), "d. MMMM yyyy", { locale: cs })}`
                      : `Vytvořeno ${format(parseISO(inv.created_at), "d. MMMM yyyy", { locale: cs })}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <Button
                    size="sm" variant="outline" className="h-7 gap-1"
                    onClick={() => handleCopyLink(`${window.location.origin}/register?invite=${inv.token}`)}
                  >
                    <Copy className="h-3 w-3" /> Kopírovat odkaz
                  </Button>
                  {!inv.email_sent_at && (
                    <Button
                      size="sm" variant="outline" className="h-7 gap-1"
                      disabled={resendingId === inv.id}
                      onClick={() => handleResendInvite(inv.id)}
                    >
                      <Send className="h-3 w-3" /> {resendingId === inv.id ? "Odesílám..." : "Odeslat znovu"}
                    </Button>
                  )}
                  <Button
                    size="sm" variant="outline" className="h-7 gap-1 text-destructive"
                    onClick={() => handleRevokeInvite(inv.id)}
                  >
                    <X className="h-3 w-3" /> Zrušit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Klient</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Klientem od</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(client => (
              <tr key={client.id} className="hover:bg-subtle transition-colors group">
                <td className="px-4 py-3">
                  <Link to={`/clients/${client.id}`} className="flex items-center gap-3">
                    <AvatarCircle initials={initialsOf(client.full_name)} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{client.full_name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(client.created_at), "d. MMMM yyyy", { locale: cs })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">Žádní klienti nenalezeni.</p>
        )}
        {loading && (
          <p className="p-8 text-center text-sm text-muted-foreground">Načítám...</p>
        )}
      </div>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Přidat klienta</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Zadejte e-mail klienta. Vygeneruje se pozvánkový odkaz, který mu pošlete — po registraci bude automaticky přiřazen k vám.
            </p>
          </DialogHeader>
          {!createdLink ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="client-email">E-mail</Label>
                <Input id="client-email" type="email" placeholder="klient@email.cz" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">Pozvánka vytvořena. Pošlete klientovi tento odkaz:</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdLink} className="text-xs" />
                <Button size="sm" variant="outline" onClick={() => handleCopyLink(createdLink)} className="shrink-0 gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> Kopírovat
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            {!createdLink ? (
              <>
                <Button variant="outline" onClick={() => { resetForm(); setShowAddDialog(false); }}>
                  Zrušit
                </Button>
                <Button onClick={handleAddClient} disabled={saving} className="gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  {saving ? "Vytvářím..." : "Vytvořit pozvánku"}
                </Button>
              </>
            ) : (
              <Button onClick={() => { resetForm(); setShowAddDialog(false); }}>Hotovo</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
