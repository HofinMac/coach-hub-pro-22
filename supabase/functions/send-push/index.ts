// Delivers queued web push notifications (public.notification_events).
// Pinged by the database (pg_net) after each enqueue and by a pg_cron backstop;
// the request body is ignored — it only drains the queue, so it needs no auth
// (verify_jwt = false in supabase/config.toml).
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "https://coach-hub-pro-22.vercel.app";

const MAX_BATCHES = 5;
const BATCH_SIZE = 50;

interface NotificationEvent {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  url: string;
  tag: string | null;
  attempts: number;
}

interface Subscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async () => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return json({ error: "VAPID keys are not configured" }, 500);
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const totals = { sent: 0, skipped: 0, failed: 0 };

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const { data: events, error } = await db.rpc("claim_notification_events", { _limit: BATCH_SIZE });
    if (error) return json({ error: error.message }, 500);
    if (!events?.length) break;

    const userIds = [...new Set((events as NotificationEvent[]).map(e => e.user_id))];
    const { data: subs, error: subsError } = await db
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", userIds);
    if (subsError) return json({ error: subsError.message }, 500);

    const subsByUser = new Map<string, Subscription[]>();
    for (const s of subs ?? []) {
      subsByUser.set(s.user_id, [...(subsByUser.get(s.user_id) ?? []), s]);
    }

    await Promise.all((events as NotificationEvent[]).map(async (event) => {
      const targets = subsByUser.get(event.user_id) ?? [];
      if (targets.length === 0) {
        totals.skipped++;
        await finish(db, event.id, "skipped", "no subscriptions");
        return;
      }

      const payload = JSON.stringify({
        title: event.title,
        body: event.body,
        url: event.url,
        tag: event.tag ?? event.id,
        category: event.category,
      });

      const results = await Promise.all(targets.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { TTL: 60 * 60 * 24, urgency: event.category === "reminder" ? "high" : "normal" },
          );
          return null;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          // Gone / not found: the browser dropped this subscription.
          if (status === 404 || status === 410) {
            await db.from("push_subscriptions").delete().eq("id", sub.id);
            return null;
          }
          return `${status ?? "error"}: ${(err as Error).message}`.slice(0, 300);
        }
      }));

      const errors = results.filter((r): r is string => r !== null);
      if (errors.length === targets.length) {
        totals.failed++;
        // Leave it "processing" for a retry by the next run unless attempts are used up.
        await finish(db, event.id, event.attempts >= 3 ? "failed" : "processing", errors[0]);
      } else {
        totals.sent++;
        await finish(db, event.id, "sent", errors[0] ?? null);
      }
    }));
  }

  return json(totals);
});

async function finish(
  db: ReturnType<typeof createClient>,
  id: string,
  status: "sent" | "skipped" | "failed" | "processing",
  error: string | null,
) {
  await db
    .from("notification_events")
    .update({ status, error, processed_at: status === "processing" ? null : new Date().toISOString() })
    .eq("id", id);
}
