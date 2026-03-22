import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Globe, Building2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  active: boolean;
  created_at: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPartners = async () => {
    const { data } = await supabase.from("partners").select("*").order("name");
    if (data) setPartners(data as Partner[]);
  };

  useEffect(() => { fetchPartners(); }, []);

  const openNew = () => {
    setEditing(null);
    setName(""); setWebsite(""); setDescription(""); setLogoUrl("");
    setShowDialog(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setName(p.name); setWebsite(p.website || ""); setDescription(p.description || ""); setLogoUrl(p.logo_url || "");
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Název je povinný"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("partners").update({
        name: name.trim(), website: website.trim(), description: description.trim(), logo_url: logoUrl.trim()
      }).eq("id", editing.id);
      if (error) toast.error("Chyba při ukládání"); else toast.success("Partner upraven");
    } else {
      const { error } = await supabase.from("partners").insert({
        name: name.trim(), website: website.trim(), description: description.trim(), logo_url: logoUrl.trim()
      });
      if (error) toast.error("Chyba při vytváření"); else toast.success("Partner vytvořen");
    }
    setSaving(false);
    setShowDialog(false);
    fetchPartners();
  };

  const toggleActive = async (p: Partner) => {
    await supabase.from("partners").update({ active: !p.active }).eq("id", p.id);
    fetchPartners();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <PageHeader title="Partneři" description="Správa partnerských značek">
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" /> Přidat partnera
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map(p => (
          <div key={p.id} className="rounded-xl bg-card shadow-card p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.name} className="h-10 w-10 rounded-lg object-contain bg-muted p-1" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Web
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
            <span className={`text-xs font-medium ${p.active ? "text-green-600" : "text-muted-foreground"}`}>
              {p.active ? "Aktivní" : "Neaktivní"}
            </span>
          </div>
        ))}
        {partners.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Zatím žádní partneři. Přidejte prvního.</p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Upravit partnera" : "Nový partner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Název *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="např. USN" />
            </div>
            <div>
              <Label>Web</Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Popis</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Krátký popis partnera" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Zrušit</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Ukládám..." : editing ? "Uložit" : "Vytvořit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}