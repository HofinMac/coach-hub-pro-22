import { describe, expect, it } from "vitest";
import { shiftEndTime } from "@/lib/utils";

describe("shiftEndTime", () => {
  it("keeps the duration", () => {
    expect(shiftEndTime("09:00", "14:00", "10:00")).toBe("15:00");
    expect(shiftEndTime("09:00", "09:30", "10:30")).toBe("11:00");
  });
  it("caps at the end of the day and ignores half-typed values", () => {
    expect(shiftEndTime("09:00", "23:30", "10:00")).toBe("23:59");
    expect(shiftEndTime("09:00", "1", "10:00")).toBe("10:00");
  });
});
