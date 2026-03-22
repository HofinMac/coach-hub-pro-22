import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { AvatarCircle } from "@/components/AvatarCircle";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Search, Camera } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Search } from "lucide-react";
import { getClientsByCoach, type ClientStatus } from "@/lib/demo-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const COACH_ID = "c1";
const filterOptions: (ClientStatus | 'all')[] = ['all', 'active', 'at_risk', 'inactive', 'lead'];
const filterLabels: Record<string, string> = {
  all: 'Všichni',
  active: 'Aktivní',
  at_risk: 'V ohrožení',
  inactive: 'Neaktivní',
  lead: 'Potenciální',
};

export default function ClientsPage() {
  const allClients = getClientsByCoach(COACH_ID);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Add client form
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = allClients
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  const resetForm = () => {
    setNewEmail("");
    setNewPhone("");
    setNewGoal("");
  };

  const handleAddClient = async () => {
    if (!newEmail.trim() && !newPhone.trim()) {
      toast.error("Vyplňte e-mail nebo telefon");
      return;
    }
    if (newEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      toast.error("Neplatný formát e-mailu");
      return;
    }
    setSaving(true);
    // TODO: integrate with backend — send invite to client
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success("Pozvánka odeslána klientovi");
    resetForm();
    setShowAddDialog(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Klienti" description={`Celkem ${allClients.length} klientů`}>
        <Button size="sm" className="gap-1.5" onClick={() => setShowAddDialog(true)}>
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
        <div className="flex gap-1.5 overflow-x-auto">
          {filterOptions.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Klient</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Stav</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Cíle</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Kredity</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Poslední aktivita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(client => (
              <tr key={client.id} className="hover:bg-subtle transition-colors group">
                <td className="px-4 py-3">
                  <Link to={`/clients/${client.id}`} className="flex items-center gap-3">
                    <AvatarCircle initials={client.avatar} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <StatusBadge status={client.status} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">{client.goals}</p>
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <span className="text-sm font-mono tabular-nums text-foreground">{client.packageCredits}</span>
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">{client.lastActivity}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">Žádní klienti nenalezeni.</p>
        )}
      </div>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Přidat klienta</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Zadejte kontakt a cíl. Klient si zbytek nastaví sám po přihlášení.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-email">E-mail</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="klient@email.cz"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Telefon</Label>
              <Input
                id="client-phone"
                type="tel"
                placeholder="+420 ..."
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-goal">Cíl klienta</Label>
              <Textarea
                id="client-goal"
                placeholder="Např. zhubnutí, nabírání svalů, rehabilitace..."
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowAddDialog(false); }}>
              Zrušit
            </Button>
            <Button onClick={handleAddClient} disabled={saving} className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              {saving ? "Odesílám..." : "Pozvat klienta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}