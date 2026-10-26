import { describe, expect, it } from "vitest";
import { parseEmails } from "@/lib/invitations";

describe("parseEmails", () => {
  it("splits on commas, semicolons, spaces and new lines, lowercases and dedupes", () => {
    expect(parseEmails("Jana@Example.cz, petr@example.cz;\nJANA@example.cz  eva@ex.cz")).toEqual({
      emails: ["jana@example.cz", "petr@example.cz", "eva@ex.cz"],
      invalid: [],
    });
  });
  it("reports invalid entries", () => {
    expect(parseEmails("jana@example.cz, nekdo, @x.cz").invalid).toEqual(["nekdo", "@x.cz"]);
  });
});
