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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildEmailHtml(coachName: string, inviteLink: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #1a2233; line-height: 1.5;">
      <h1 style="font-size: 20px; margin-bottom: 12px;">Pozvánka do Coach Hub</h1>
      <p><strong>${coachName}</strong> vás zve, abyste se připojili do <strong>Coach Hub</strong> — aplikace, ve které najdete své tréninkové plány, můžete si rezervovat termíny a komunikovat se svým trenérem na jednom místě.</p>
      <p style="margin: 24px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Dokončit registraci
        </a>
      </p>
      <p style="font-size: 13px; color: #667085;">Pokud tlačítko nefunguje, zkopírujte tento odkaz do prohlížeče:<br />${inviteLink}</p>
    </div>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization" }, 401);
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Invalid session" }, 401);
    }

    const { inviteId } = await req.json();
    if (!inviteId) {
      return jsonResponse({ error: "inviteId is required" }, 400);
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: invite, error: inviteError } = await adminClient
      .from("client_invites")
      .select("id, coach_id, email, token, status")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return jsonResponse({ error: "Invite not found" }, 404);
    }

    if (invite.coach_id !== user.id) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    if (invite.status !== "pending") {
      return jsonResponse({ error: "Invite is not pending" }, 409);
    }

    const { data: coachProfile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", invite.coach_id)
      .single();

    const coachName = coachProfile?.full_name?.trim() || "Váš trenér";
    const appUrl = req.headers.get("origin") ?? "https://coach-hub.eu";
    const inviteLink = `${appUrl}/register?invite=${invite.token}`;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [invite.email],
        subject: `${coachName} vás zve do Coach Hub`,
        html: buildEmailHtml(coachName, inviteLink),
      }),
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      console.error("Resend API error:", resendResp.status, errText);
      return jsonResponse({ error: "Failed to send email" }, 502);
    }

    await adminClient
      .from("client_invites")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", invite.id);

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("send-invite error:", err);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});
