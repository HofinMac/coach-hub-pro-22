import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, Mail, Globe } from "lucide-react";
import { clients } from "@/lib/demo-data";

interface ShareSlotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slotCount: number;
}

type ShareType = "all_clients" | "selected" | "external_email";

export default function ShareSlotsDialog({ open, onOpenChange, slotCount }: ShareSlotsDialogProps) {
  const [shareType, setShareType] = useState<ShareType>("all_clients");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [externalEmails, setExternalEmails] = useState("");
  const [message, setMessage] = useState("");

  const toggleClient = (id: string) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleShare = () => {
    if (shareType === "selected" && selectedClients.length === 0) {
      toast.error("Vyberte alespoň jednoho klienta");
      return;
    }
    if (shareType === "external_email" && !externalEmails.trim()) {
      toast.error("Zadejte alespoň jeden e-mail");
      return;
    }

    // Demo — in production this would call an edge function or create notifications
    const recipientCount = shareType === "all_clients"
      ? clients.length
      : shareType === "selected"
        ? selectedClients.length
        : externalEmails.split(",").filter(e => e.trim()).length;

    toast.success(`Sdíleno ${slotCount} termínů s ${recipientCount} příjemci`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sdílet volné termíny ({slotCount})</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Komu sdílet</Label>
            <Select value={shareType} onValueChange={v => setShareType(v as ShareType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_clients">
                  <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Všem klientům</span>
                </SelectItem>
                <SelectItem value="selected">
                  <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Vybraným klientům</span>
                </SelectItem>
                <SelectItem value="external_email">
                  <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> E-mailem (mimo appku)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shareType === "selected" && (
            <div className="grid gap-2">
              <Label>Vyberte klienty</Label>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                {clients.slice(0, 8).map(c => (
                  <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer">
                    <Checkbox
                      checked={selectedClients.includes(c.id)}
                      onCheckedChange={() => toggleClient(c.id)}
                    />
                    <span className="text-sm">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {shareType === "external_email" && (
            <div className="grid gap-2">
              <Label>E-mailové adresy</Label>
              <Textarea
                value={externalEmails}
                onChange={e => setExternalEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Oddělte čárkou. Příjemci dostanou odkaz na registraci a rezervaci.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Zpráva (volitelné)</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Nové termíny na příští týden jsou k dispozici!"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Zrušit</Button>
          </DialogClose>
          <Button onClick={handleShare}>
            <Globe className="h-4 w-4 mr-1.5" /> Sdílet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
