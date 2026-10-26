import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchCoachClients, requireUserId, type ProfileRow } from "@/lib/db";
import { parseEmails, type InviteSelection } from "@/lib/invitations";

/** Pick the coach's app clients and/or type e-mail addresses of people outside the app. */
export function InvitePicker({
  value, onChange, excludeClientIds = [],
}: {
  value: InviteSelection;
  onChange: (v: InviteSelection) => void;
  excludeClientIds?: string[];
}) {
  const [clients, setClients] = useState<ProfileRow[] | null>(null);

  useEffect(() => {
    requireUserId().then(fetchCoachClients).then(setClients).catch(() => setClients([]));
  }, []);

  const toggle = (id: string) =>
    onChange({
      ...value,
      clientIds: value.clientIds.includes(id) ? value.clientIds.filter(c => c !== id) : [...value.clientIds, id],
    });

  const { emails, invalid } = parseEmails(value.emailsText);
  const available = (clients ?? []).filter(c => !excludeClientIds.includes(c.id));

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Klienti v aplikaci</Label>
        {clients === null ? (
          <p className="text-xs text-muted-foreground">Načítám…</p>
        ) : available.length === 0 ? (
          <p className="text-xs text-muted-foreground">Žádní další klienti k pozvání.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
            {available.map(c => (
              <label key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-subtle">
                <Checkbox checked={value.clientIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                <span className="truncate">{c.full_name || c.email}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-emails" className="text-xs">E-maily lidí mimo aplikaci</Label>
        <Textarea
          id="invite-emails"
          value={value.emailsText}
          onChange={e => onChange({ ...value, emailsText: e.target.value })}
          placeholder="jana@example.cz, petr@example.cz"
          rows={2}
        />
        <p className="text-[11px] text-muted-foreground">
          Oddělte čárkou nebo novým řádkem. Dostanou e-mail s tlačítky Jdu / Nejdu.
          {emails.length > 0 && ` · ${emails.length} ${emails.length === 1 ? "adresa" : emails.length < 5 ? "adresy" : "adres"}`}
        </p>
        {invalid.length > 0 && (
          <p className="text-[11px] text-destructive">Neplatné: {invalid.join(", ")}</p>
        )}
      </div>
    </div>
  );
}
