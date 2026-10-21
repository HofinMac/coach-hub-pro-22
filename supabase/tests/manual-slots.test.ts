// @vitest-environment node
/** Slots the coach occupies by hand for a client outside the app. */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { CLIENT, COACH, createTestDb } from "./helpers";

const MANUAL = "eeeeeeee-0000-0000-0000-0000000000e1";

let db: PGlite;
let asUser: Awaited<ReturnType<typeof createTestDb>>["asUser"];
let count: Awaited<ReturnType<typeof createTestDb>>["count"];

beforeAll(async () => {
  ({ db, asUser, count } = await createTestDb());
  await asUser(CLIENT, `SELECT register_push_subscription('https://push.example/c', 'p', 'a')`);
  await asUser(COACH, `SELECT register_push_subscription('https://push.example/k', 'p', 'a')`);
}, 60_000);

describe("manually occupied slots", () => {
  it("the coach can create one, and app clients neither see nor book it", async () => {
    await asUser(COACH, `INSERT INTO coach_slots (id, coach_id, start_time, end_time, status, manual_client_name)
      VALUES ('${MANUAL}', '${COACH}', now() + interval '30 minutes', now() + interval '90 minutes', 'booked', 'Pavel Novák')`);
    expect(await count(CLIENT, `SELECT 1 FROM coach_slots WHERE id = '${MANUAL}'`)).toBe(0);
    await expect(asUser(CLIENT, `SELECT book_coach_slot('${MANUAL}')`)).rejects.toThrow(/SLOT_NOT_BOOKABLE|SLOT_NOT_FOUND|NOT_YOUR_COACH/);
  });

  it("rejects absurdly long names", async () => {
    await expect(asUser(COACH, `UPDATE coach_slots SET manual_client_name = repeat('x', 121) WHERE id = '${MANUAL}'`))
      .rejects.toThrow(/check constraint/);
  });

  it("reminds the coach with the manual client's name", async () => {
    await db.exec("DELETE FROM notification_events");
    await db.query("SELECT enqueue_due_reminders()");
    const { rows } = await db.query<{ user_id: string; body: string }>("SELECT user_id, body FROM notification_events");
    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe(COACH);
    expect(rows[0].body).toMatch(/· Pavel Novák$/);
  });
});
