// @vitest-environment node
/** Coach books an app client directly into own slots. */
import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { CLIENT, COACH, COACH2, createTestDb } from "./helpers";

let db: PGlite;
let asUser: Awaited<ReturnType<typeof createTestDb>>["asUser"];

const A = "bbbbbbbb-0000-0000-0000-0000000000a1";
const B = "bbbbbbbb-0000-0000-0000-0000000000a2";
const C = "bbbbbbbb-0000-0000-0000-0000000000a3";
const MANUAL = "bbbbbbbb-0000-0000-0000-0000000000a4";

const slot = async (id: string) =>
  (await db.query<{ booked_count: number; status: string }>(`SELECT booked_count, status FROM coach_slots WHERE id = '${id}'`)).rows[0];
const events = async () => (await db.query<{ title: string; body: string }>("SELECT title, body FROM notification_events ORDER BY created_at")).rows;

beforeAll(async () => {
  ({ db, asUser } = await createTestDb());
  await db.exec(`
    INSERT INTO coach_slots (id, coach_id, start_time, end_time, capacity) VALUES
      ('${A}', '${COACH}', now() + interval '1 day', now() + interval '1 day 1 hour', 1),
      ('${B}', '${COACH}', now() + interval '8 days', now() + interval '8 days 1 hour', 1),
      ('${C}', '${COACH}', now() + interval '15 days', now() + interval '15 days 1 hour', 1);
    INSERT INTO coach_slots (id, coach_id, start_time, end_time, status, manual_client_name)
      VALUES ('${MANUAL}', '${COACH}', now() + interval '2 days', now() + interval '2 days 1 hour', 'booked', 'Pavel');
  `);
  await asUser(CLIENT, `SELECT register_push_subscription('https://push.example/k', 'p', 'a')`);
}, 60_000);

describe("coach_book_client", () => {
  it("books a single slot; the client gets the regular push", async () => {
    await db.exec("DELETE FROM notification_events");
    const n = (await asUser<{ n: number }>(COACH, `SELECT coach_book_client(ARRAY['${A}']::uuid[], '${CLIENT}') AS n`)).rows[0].n;
    expect(n).toBe(1);
    expect(await slot(A)).toEqual({ booked_count: 1, status: "booked" });
    expect((await events()).map(e => e.title)).toEqual(["Nový termín tréninku"]);
  });

  it("is idempotent and refuses full, manual or foreign slots and foreign clients", async () => {
    await asUser(COACH, `SELECT coach_book_client(ARRAY['${A}']::uuid[], '${CLIENT}')`);
    expect((await slot(A)).booked_count).toBe(1);
    await expect(asUser(COACH, `SELECT coach_book_client(ARRAY['${MANUAL}']::uuid[], '${CLIENT}')`)).rejects.toThrow(/SLOT_NOT_BOOKABLE/);
    await expect(asUser(COACH2, `SELECT coach_book_client(ARRAY['${B}']::uuid[], '${CLIENT}')`)).rejects.toThrow(/NOT_YOUR_CLIENT/);
    await expect(asUser(CLIENT, `SELECT coach_book_client(ARRAY['${B}']::uuid[], '${CLIENT}')`)).rejects.toThrow(/NOT_YOUR_CLIENT/);
  });

  it("books a series with one summary push", async () => {
    await db.exec("DELETE FROM notification_events");
    const n = (await asUser<{ n: number }>(COACH, `SELECT coach_book_client(ARRAY['${B}', '${C}']::uuid[], '${CLIENT}') AS n`)).rows[0].n;
    expect(n).toBe(2);
    const ev = await events();
    expect(ev).toHaveLength(1);
    expect(ev[0].title).toBe("Nové termíny tréninků");
    expect(ev[0].body).toMatch(/na 2 tréninků/);
  });

  it("confirms a pending request without taking a second seat", async () => {
    const D = "bbbbbbbb-0000-0000-0000-0000000000a5";
    await db.exec(`INSERT INTO coach_slots (id, coach_id, start_time, end_time, capacity, slot_type)
      VALUES ('${D}', '${COACH}', now() + interval '3 days', now() + interval '3 days 1 hour', 3, 'group')`);
    await asUser(CLIENT, `SELECT book_coach_slot('${D}')`);
    await asUser(COACH, `SELECT coach_book_client(ARRAY['${D}']::uuid[], '${CLIENT}')`);
    expect(await slot(D)).toEqual({ booked_count: 1, status: "partially_booked" });
  });
});
