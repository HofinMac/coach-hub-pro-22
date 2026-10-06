// @vitest-environment node
/** Push notification outbox: what each domain event enqueues, for whom, and who may touch it. */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { CLIENT, COACH, COACH2, createTestDb } from "./helpers";

const SLOT = "aaaaaaaa-0000-0000-0000-0000000000a1";

let db: PGlite;
let asUser: Awaited<ReturnType<typeof createTestDb>>["asUser"];

interface EventRow { user_id: string; category: string; title: string; body: string; url: string; tag: string | null }

const events = async () =>
  (await db.query<EventRow>("SELECT user_id, category, title, body, url, tag FROM notification_events ORDER BY created_at, title")).rows;

const subscribe = (uid: string, n: number) =>
  asUser(uid, `SELECT register_push_subscription('https://push.example/${uid}/${n}', 'p256', 'auth', 'test')`);

beforeAll(async () => {
  ({ db, asUser } = await createTestDb());
  await db.exec(`
    UPDATE profiles SET full_name = 'Petr Trenér' WHERE id = '${COACH}';
    UPDATE profiles SET full_name = 'Karel Klient' WHERE id = '${CLIENT}';
    INSERT INTO coach_slots (id, coach_id, start_time, end_time, capacity)
      VALUES ('${SLOT}', '${COACH}', '2026-10-09 06:00:00+00', '2026-10-09 07:00:00+00', 3);
  `);
  await subscribe(COACH, 1);
  await subscribe(CLIENT, 1);
}, 60_000);

beforeEach(async () => {
  await db.exec("DELETE FROM notification_events");
});

describe("subscriptions", () => {
  it("moves a device endpoint to whoever registers it last", async () => {
    await subscribe(COACH2, 9);
    await asUser(COACH, `SELECT register_push_subscription('https://push.example/${COACH2}/9', 'p', 'a')`);
    const { rows } = await db.query<{ user_id: string }>(`SELECT user_id FROM push_subscriptions WHERE endpoint LIKE '%/${COACH2}/9'`);
    expect(rows).toEqual([{ user_id: COACH }]);
    await db.exec(`DELETE FROM push_subscriptions WHERE endpoint LIKE '%/${COACH2}/9'`);
  });
  it("users see only their own subscriptions and cannot insert directly", async () => {
    expect((await asUser(COACH, "SELECT user_id FROM push_subscriptions")).rows).toEqual([{ user_id: COACH }]);
    await expect(asUser(COACH, `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ('${COACH}', 'https://x', 'p', 'a')`))
      .rejects.toThrow(/row-level security/);
  });
});

describe("outbox access", () => {
  it("is invisible to users and its functions are not callable by them", async () => {
    await asUser(CLIENT, `INSERT INTO messages (coach_id, client_id, sender_id, body) VALUES ('${COACH}', '${CLIENT}', '${CLIENT}', 'x')`);
    expect((await asUser(COACH, "SELECT * FROM notification_events")).rows).toHaveLength(0);
    await expect(asUser(COACH, "SELECT * FROM claim_notification_events(10)")).rejects.toThrow(/permission denied/);
    await expect(asUser(COACH, `SELECT enqueue_notification('${CLIENT}', 'newMessage', 'spam', 'x', '/')`))
      .rejects.toThrow(/permission denied/);
  });
  it("claims each pending event once", async () => {
    await asUser(CLIENT, `INSERT INTO messages (coach_id, client_id, sender_id, body) VALUES ('${COACH}', '${CLIENT}', '${CLIENT}', 'x')`);
    expect((await db.query("SELECT * FROM claim_notification_events(10)")).rows).toHaveLength(1);
    expect((await db.query("SELECT * FROM claim_notification_events(10)")).rows).toHaveLength(0);
  });
});

describe("messages", () => {
  it("notifies the other participant with sender name and a deep link", async () => {
    await asUser(CLIENT, `INSERT INTO messages (coach_id, client_id, sender_id, body) VALUES ('${COACH}', '${CLIENT}', '${CLIENT}', 'Můžeme ve čtvrtek?')`);
    await asUser(COACH, `INSERT INTO messages (coach_id, client_id, sender_id, body) VALUES ('${COACH}', '${CLIENT}', '${COACH}', 'Jasně')`);
    expect(await events()).toEqual([
      { user_id: COACH, category: "newMessage", title: "Karel Klient", body: "Můžeme ve čtvrtek?",
        url: `/messages?client=${CLIENT}`, tag: `msg-${COACH}-${CLIENT}` },
      { user_id: CLIENT, category: "newMessage", title: "Petr Trenér", body: "Jasně",
        url: "/klient/zpravy", tag: `msg-${COACH}-${CLIENT}` },
    ]);
  });
  it("respects the recipient's push switch for the category", async () => {
    await db.exec(`INSERT INTO user_settings (user_id, notification_settings) VALUES ('${CLIENT}', '{"newMessage": {"push": false}}')`);
    await asUser(COACH, `INSERT INTO messages (coach_id, client_id, sender_id, body) VALUES ('${COACH}', '${CLIENT}', '${COACH}', 'Ahoj')`);
    expect(await events()).toEqual([]);
    await db.exec(`DELETE FROM user_settings WHERE user_id = '${CLIENT}'`);
  });
});

describe("bookings", () => {
  it("covers request → confirm → client cancel, with Prague time", async () => {
    await asUser(CLIENT, `SELECT book_coach_slot('${SLOT}')`);
    await asUser(COACH, "UPDATE slot_bookings SET status = 'confirmed'");
    await asUser(CLIENT, "SELECT cancel_client_booking((SELECT id FROM slot_bookings LIMIT 1))");
    const rows = await events();
    expect(rows.map(r => [r.user_id, r.category, r.title, r.body])).toEqual([
      [COACH, "newBooking", "Nová žádost o rezervaci", "Karel Klient · pá 9. 10. v 8:00"],
      [CLIENT, "newBooking", "Rezervace potvrzena", "Trénink pá 9. 10. v 8:00"],
      [COACH, "cancelledBooking", "Klient zrušil rezervaci", "Karel Klient · pá 9. 10. v 8:00"],
    ]);
    await db.exec("DELETE FROM slot_bookings; UPDATE coach_slots SET booked_count = 0, status = 'available'");
  });
  it("tells the client when the coach rejects", async () => {
    await asUser(CLIENT, `SELECT book_coach_slot('${SLOT}')`);
    await db.exec("DELETE FROM notification_events");
    await asUser(COACH, "UPDATE slot_bookings SET status = 'rejected'");
    expect((await events()).map(r => [r.user_id, r.title])).toEqual([[CLIENT, "Rezervace zamítnuta"]]);
    await db.exec("DELETE FROM slot_bookings; UPDATE coach_slots SET booked_count = 0, status = 'available'");
  });
});

describe("plans and payments", () => {
  it("notifies the client when a plan becomes active or changes, not for drafts", async () => {
    await asUser(COACH, `INSERT INTO workout_plans (id, coach_id, client_id, title) VALUES ('dddddddd-0000-0000-0000-000000000001', '${COACH}', '${CLIENT}', 'Síla 1')`);
    expect(await events()).toEqual([]);
    await asUser(COACH, "UPDATE workout_plans SET status = 'active'");
    await asUser(COACH, `UPDATE workout_plans SET exercises = '[{"exerciseName": "Dřep"}]'`);
    await asUser(COACH, "UPDATE workout_plans SET description = 'jen popis'");
    expect((await events()).map(r => r.title)).toEqual(["Nový tréninkový plán", "Trenér upravil váš plán"]);
  });
  it("announces a pending payment and its settlement", async () => {
    await asUser(COACH, `INSERT INTO payments (coach_id, client_id, description, amount_czk, due_date)
      VALUES ('${COACH}', '${CLIENT}', '10 lekcí', 12500, '2026-10-20')`);
    await asUser(COACH, "UPDATE payments SET status = 'paid', paid_at = now()");
    expect((await events()).map(r => [r.title, r.body])).toEqual([
      ["Nová platba k úhradě", "10 lekcí · 12 500 Kč, splatnost 20. 10."],
      ["Platba přijata", "10 lekcí · 12 500 Kč"],
    ]);
  });
});

describe("reminders", () => {
  it("reminds the client and the coach once, inside the reminder window", async () => {
    const soon = "bbbbbbbb-0000-0000-0000-0000000000b1";
    await db.exec(`
      INSERT INTO coach_slots (id, coach_id, start_time, end_time, capacity)
        VALUES ('${soon}', '${COACH}', now() + interval '30 minutes', now() + interval '90 minutes', 1);
      INSERT INTO slot_bookings (slot_id, client_id, status) VALUES ('${soon}', '${CLIENT}', 'confirmed');
      DELETE FROM notification_events;
    `);
    expect((await db.query<{ n: number }>("SELECT enqueue_due_reminders() AS n")).rows[0].n).toBe(2);
    expect((await db.query<{ n: number }>("SELECT enqueue_due_reminders() AS n")).rows[0].n).toBe(0);
    expect((await events()).map(r => [r.user_id, r.category]).sort()).toEqual([[COACH, "reminder"], [CLIENT, "reminder"]]);
  });
});

describe("test notification", () => {
  it("goes to the caller and is rate limited", async () => {
    await asUser(COACH, "SELECT send_test_notification()");
    await expect(asUser(COACH, "SELECT send_test_notification()")).rejects.toThrow(/TOO_MANY/);
    await expect(asUser(COACH2, "SELECT send_test_notification()")).rejects.toThrow(/NO_SUBSCRIPTION/);
    expect((await events()).map(r => [r.user_id, r.category])).toEqual([[COACH, "test"]]);
  });
});
