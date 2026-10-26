import { describe, expect, it } from "vitest";
import { layoutOverlaps } from "@/lib/calendar-layout";

const s = (id: string, from: string, to: string) =>
  ({ id, start_time: `2026-10-26T${from}:00Z`, end_time: `2026-10-26T${to}:00Z` });

describe("layoutOverlaps", () => {
  it("keeps non-overlapping slots full width", () => {
    const m = layoutOverlaps([s("a", "09:00", "10:00"), s("b", "10:00", "11:00")]);
    expect(m.get("a")).toEqual({ col: 0, cols: 1 });
    expect(m.get("b")).toEqual({ col: 0, cols: 1 });
  });

  it("puts slots at the same time side by side", () => {
    const m = layoutOverlaps([s("klara", "09:00", "10:00"), s("karel", "09:00", "10:00")]);
    expect([m.get("klara"), m.get("karel")].map(p => p!.cols)).toEqual([2, 2]);
    expect(new Set([m.get("klara")!.col, m.get("karel")!.col])).toEqual(new Set([0, 1]));
  });

  it("reuses a freed column within a cluster", () => {
    const m = layoutOverlaps([s("a", "09:00", "11:00"), s("b", "09:00", "10:00"), s("c", "10:00", "11:00")]);
    expect(m.get("a")).toEqual({ col: 0, cols: 2 });
    expect(m.get("b")).toEqual({ col: 1, cols: 2 });
    expect(m.get("c")).toEqual({ col: 1, cols: 2 });
  });
});
