import { describe, expect, it } from "vitest";
import type { PlanExercise } from "@/lib/domain";
import { groupExercises, isLinkedToNext, linkWithNext, normalizeSupersets, unlinkFromNext } from "@/lib/supersets";

const ex = (name: string, supersetId?: string): PlanExercise =>
  ({ exerciseId: name, exerciseName: name, sets: 3, reps: "10", rpe: 7, rest: 60, ...(supersetId ? { supersetId } : {}) });

const shape = (list: PlanExercise[]) =>
  groupExercises(list).map(b => (b.label ? `${b.label}:` : "") + b.items.map(i => i.exercise.exerciseName).join("+"));

describe("supersets", () => {
  it("groups consecutive exercises with the same id and labels them A, B…", () => {
    const list = [ex("dřep"), ex("kliky", "s1"), ex("přítahy", "s1"), ex("plank"), ex("výpad", "s2"), ex("mrtvý tah", "s2"), ex("hip thrust", "s2")];
    expect(shape(list)).toEqual(["dřep", "A:kliky+přítahy", "plank", "B:výpad+mrtvý tah+hip thrust"]);
  });

  it("a lone id is not a superset", () => {
    expect(shape([ex("a", "s1"), ex("b")])).toEqual(["a", "b"]);
    expect(normalizeSupersets([ex("a", "s1"), ex("b")])[0].supersetId).toBeUndefined();
  });

  it("links and merges neighbours, including into a giant set", () => {
    let list = [ex("a"), ex("b"), ex("c"), ex("d")];
    list = linkWithNext(list, 0);
    expect(shape(list)).toEqual(["A:a+b", "c", "d"]);
    list = linkWithNext(list, 2);
    expect(shape(list)).toEqual(["A:a+b", "B:c+d"]);
    list = linkWithNext(list, 1);
    expect(shape(list)).toEqual(["A:a+b+c+d"]);
  });

  it("unlinks into two supersets or single exercises", () => {
    let list = linkWithNext(linkWithNext(linkWithNext([ex("a"), ex("b"), ex("c"), ex("d")], 0), 1), 2);
    list = unlinkFromNext(list, 1);
    expect(shape(list)).toEqual(["A:a+b", "B:c+d"]);
    expect(isLinkedToNext(list, 1)).toBe(false);
    list = unlinkFromNext(list, 0);
    expect(shape(list)).toEqual(["a", "b", "A:c+d"]);
  });

  it("moving an exercise out of a superset splits reused ids", () => {
    // a+b superset, then b moved after c → a, c, b: id s1 appears twice apart
    const list = normalizeSupersets([ex("a", "s1"), ex("c"), ex("b", "s1")]);
    expect(shape(list)).toEqual(["a", "c", "b"]);
    const twoRuns = normalizeSupersets([ex("a", "s1"), ex("b", "s1"), ex("x"), ex("c", "s1"), ex("d", "s1")]);
    expect(shape(twoRuns)).toEqual(["A:a+b", "x", "B:c+d"]);
    expect(twoRuns[0].supersetId).not.toBe(twoRuns[3].supersetId);
  });
});
