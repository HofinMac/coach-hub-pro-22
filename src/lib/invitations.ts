/** Group lesson invitations: invite app clients / e-mail addresses and send the e-mails. */
import { supabase } from "@/integrations/supabase/client";
import { rpc, type SlotInvitationRow } from "@/lib/db";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Splits free text (commas, semicolons, spaces, new lines) into unique e-mails and invalid entries. */
export function parseEmails(text: string): { emails: string[]; invalid: string[] } {
  const parts = text.split(/[\s,;]+/).map(p => p.trim().toLowerCase()).filter(Boolean);
  const emails = [...new Set(parts.filter(p => EMAIL_RE.test(p)))];
  const invalid = parts.filter(p => !EMAIL_RE.test(p));
  return { emails, invalid };
}

export interface InviteResult {
  created: number;
  emailed: number;
  emailFailed: number;
}

/** Creates the invitations, then e-mails everyone who has an address. */
export async function inviteToSlot(slotId: string, clientIds: string[], emails: string[]): Promise<InviteResult> {
  const { data, error } = await rpc("invite_to_slot", { _slot_id: slotId, _client_ids: clientIds, _emails: emails });
  if (error) throw error;
  const created = (data as SlotInvitationRow[] | null)?.length ?? 0;
  if (created === 0) return { created, emailed: 0, emailFailed: 0 };

  const { data: sent, error: sendError } = await supabase.functions.invoke("send-slot-invitations", { body: { slotId } });
  if (sendError) return { created, emailed: 0, emailFailed: created };
  return { created, emailed: sent?.sent ?? 0, emailFailed: sent?.failed ?? 0 };
}

export function inviteErrorText(err: unknown) {
  const msg = (err as { message?: string })?.message ?? "";
  if (msg.includes("INVALID_EMAIL")) return `Neplatný e-mail: ${msg.split("INVALID_EMAIL:")[1]?.trim() ?? ""}`;
  if (msg.includes("TOO_MANY_INVITATIONS")) return "Na jednu lekci jde pozvat nejvýš 50 lidí.";
  if (msg.includes("DAILY_LIMIT")) return "Dnes už jste poslali příliš mnoho e-mailových pozvánek, zkuste to zítra.";
  if (msg.includes("SLOT_CLOSED")) return "Lekce už začala nebo je zrušená.";
  if (msg.includes("SLOT_MANUALLY_OCCUPIED")) return "Termín je obsazený ručně, nejdřív ho uvolněte.";
  return "Pozvánky se nepodařilo odeslat.";
}

export const invitationStatusLabel: Record<SlotInvitationRow["status"], string> = {
  pending: "Čeká na odpověď",
  accepted: "Jde",
  declined: "Nejde",
  withdrawn: "Zrušeno",
};

export const respondErrorText = (err: unknown) => {
  const msg = (err as { message?: string })?.message ?? "";
  if (msg.includes("SLOT_FULL")) return "Lekce je už plně obsazená.";
  if (msg.includes("SLOT_CLOSED")) return "Lekce už začala nebo byla zrušena.";
  return "Odpověď se nepodařilo uložit.";
};

export interface InviteSelection {
  clientIds: string[];
  emailsText: string;
}

export const emptyInviteSelection: InviteSelection = { clientIds: [], emailsText: "" };

export const inviteCount = (v: InviteSelection) => v.clientIds.length + parseEmails(v.emailsText).emails.length;
