import type { PlanExercise } from "@/lib/domain";

export interface ExerciseBlock {
  /** Set for supersets (2+ exercises performed back to back). */
  supersetId: string | null;
  /** Letter for supersets in plan order: A, B, C… */
  label: string | null;
  items: Array<{ exercise: PlanExercise; index: number }>;
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Splits a plan into single exercises and supersets (runs of the same supersetId). */
export function groupExercises(exercises: PlanExercise[]): ExerciseBlock[] {
  const blocks: ExerciseBlock[] = [];
  exercises.forEach((exercise, index) => {
    const prev = blocks[blocks.length - 1];
    if (exercise.supersetId && prev?.supersetId === exercise.supersetId) {
      prev.items.push({ exercise, index });
    } else {
      blocks.push({ supersetId: exercise.supersetId ?? null, label: null, items: [{ exercise, index }] });
    }
  });
  let letter = 0;
  for (const block of blocks) {
    if (block.supersetId && block.items.length < 2) block.supersetId = null;
    if (block.supersetId) block.label = String.fromCharCode(65 + (letter++ % 26));
  }
  return blocks;
}

/** Drops ids that no longer join 2+ adjacent exercises and splits ids reused in separate places. */
export function normalizeSupersets(exercises: PlanExercise[]): PlanExercise[] {
  const result: PlanExercise[] = exercises.map(e => ({ ...e }));
  const seen = new Set<string>();
  for (const block of groupExercises(exercises)) {
    const ids = block.items.map(i => i.index);
    let id = block.supersetId;
    if (id && seen.has(id)) id = newId();
    if (id) seen.add(id);
    for (const i of ids) {
      if (id) result[i].supersetId = id;
      else delete result[i].supersetId;
    }
  }
  return result;
}

export const isLinkedToNext = (exercises: PlanExercise[], index: number) =>
  !!exercises[index]?.supersetId && exercises[index].supersetId === exercises[index + 1]?.supersetId;

/** Joins exercise `index` with the next one (merging their supersets). */
export function linkWithNext(exercises: PlanExercise[], index: number): PlanExercise[] {
  if (index < 0 || index >= exercises.length - 1) return exercises;
  const a = exercises[index];
  const b = exercises[index + 1];
  const id = a.supersetId ?? b.supersetId ?? newId();
  const oldB = b.supersetId;
  const next = exercises.map((e, i) => {
    if (i === index || i === index + 1) return { ...e, supersetId: id };
    // pull the rest of b's superset (after b) into the joined one
    if (oldB && i > index + 1 && e.supersetId === oldB) return { ...e, supersetId: id };
    return e;
  });
  return normalizeSupersets(next);
}

/** Breaks the superset between exercise `index` and the next one. */
export function unlinkFromNext(exercises: PlanExercise[], index: number): PlanExercise[] {
  if (!isLinkedToNext(exercises, index)) return exercises;
  const oldId = exercises[index].supersetId;
  const tailId = newId();
  let inTail = true;
  const next = exercises.map((e, i) => {
    if (i <= index) return e;
    if (inTail && e.supersetId === oldId) return { ...e, supersetId: tailId };
    inTail = false;
    return e;
  });
  return normalizeSupersets(next);
}

/** Position → "A1", "A2"… for exercises that are part of a superset. */
export function supersetLabels(exercises: PlanExercise[]): Map<number, string> {
  const labels = new Map<number, string>();
  for (const block of groupExercises(exercises)) {
    if (block.label) block.items.forEach((item, n) => labels.set(item.index, `${block.label}${n + 1}`));
  }
  return labels;
}
