// Sends e-mails for group lesson invitations (public.slot_invitations) that have
// not been e-mailed yet. Called by the coach's app right after invite_to_slot();
// each e-mail carries "Jdu / Nejdu" links to /pozvanka/<token> (no login needed).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "Coach Hub <invite@coach-hub.eu>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://coach-hub-pro-22.vercel.app";

const SLOT_TYPES: Record<string, string> = {
  individual: "Individuální trénink",
  online: "Online konzultace",
  group: "Skupinová lekce",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function formatWhen(startIso: string, endIso: string) {
  const opts = { timeZone: "Europe/Prague" } as const;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = start.toLocaleDateString("cs-CZ", { ...opts, weekday: "long", day: "numeric", month: "long" });
  const time = (d: Date) => d.toLocaleTimeString("cs-CZ", { ...opts, hour: "numeric", minute: "2-digit" });
  return `${day}, ${time(start)}–${time(end)}`;
}

function buildEmail(p: { coachName: string; when: string; type: string; notes: string; yes: string; no: string }) {
  const button = (href: string, label: string, bg: string) =>
    `<a href="${href}" style="display:inline-block;background:${bg};color:#ffffff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">${label}</a>`;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;color:#1a2233;line-height:1.5">
      <h1 style="font-size:20px;margin-bottom:12px">Pozvánka na lekci</h1>
      <p><strong>${escapeHtml(p.coachName)}</strong> vás zve na lekci:</p>
      <p style="font-size:16px;margin:16px 0"><strong>${escapeHtml(p.type)}</strong><br />${escapeHtml(p.when)}</p>
      ${p.notes ? `<p style="color:#667085">${escapeHtml(p.notes)}</p>` : ""}
      <p style="margin:24px 0">${button(p.yes, "Jdu", "#0d9488")}${button(p.no, "Nejdu", "#667085")}</p>
      <p style="font-size:13px;color:#667085">Odpověď můžete do začátku lekce změnit stejnými tlačítky.</p>
    </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);
    const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Invalid session" }, 401);

    const { slotId } = await req.json();
    if (!slotId) return json({ error: "slotId is required" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: slot } = await admin
      .from("coach_slots")
      .select("id, coach_id, start_time, end_time, slot_type, notes, status")
      .eq("id", slotId)
      .single();
    if (!slot || slot.coach_id !== user.id) return json({ error: "Slot not found" }, 404);
    if (slot.status === "cancelled" || new Date(slot.start_time) <= new Date()) return json({ error: "Slot closed" }, 409);

    const { data: invitations, error } = await admin
      .from("slot_invitations")
      .select("id, email, token")
      .eq("slot_id", slotId)
      .eq("status", "pending")
      .is("email_sent_at", null)
      .not("email", "is", null)
      .limit(50);
    if (error) return json({ error: error.message }, 500);

    const { data: coach } = await admin.from("profiles").select("full_name").eq("id", user.id).single();
    const coachName = coach?.full_name?.trim() || "Váš trenér";
    const when = formatWhen(slot.start_time, slot.end_time);
    const type = SLOT_TYPES[slot.slot_type] ?? "Lekce";
    const notes = (slot.notes ?? "").trim();

    let sent = 0;
    let failed = 0;
    for (const inv of invitations ?? []) {
      const link = `${APP_URL}/pozvanka/${inv.token}`;
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [inv.email],
          subject: `${coachName} vás zve na lekci – ${when}`,
          html: buildEmail({ coachName, when, type, notes, yes: `${link}?odpoved=ano`, no: `${link}?odpoved=ne` }),
        }),
      });
      if (resp.ok) {
        sent++;
        await admin.from("slot_invitations").update({ email_sent_at: new Date().toISOString(), email_error: null }).eq("id", inv.id);
      } else {
        failed++;
        const text = (await resp.text()).slice(0, 300);
        console.error("Resend error", resp.status, text);
        await admin.from("slot_invitations").update({ email_error: `${resp.status}: ${text}` }).eq("id", inv.id);
      }
    }
    return json({ sent, failed });
  } catch (err) {
    console.error("send-slot-invitations error:", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
