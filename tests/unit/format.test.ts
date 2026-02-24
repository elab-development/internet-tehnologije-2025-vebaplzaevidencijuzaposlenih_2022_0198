import { describe, it, expect } from "vitest";
import {
  pad2,
  isoToHHMM,
  safeToISOString,
  fmtLocalDateTimeSR,
} from "@/lib/date/format";

describe("lib/date/format.ts", () => {
  it("pad2 pads 0-9 and leaves 2+ digits", () => {
    expect(pad2(0)).toBe("00");
    expect(pad2(9)).toBe("09");
    expect(pad2(10)).toBe("10");
  });

  it("isoToHHMM returns HH:MM (local) from an ISO-like string", () => {
    const isoLocal = "2026-02-08T09:05:00";
    expect(isoToHHMM(isoLocal)).toBe("09:05");
  });

  it("safeToISOString returns null for invalid date", () => {
    const bad = new Date("not-a-date");
    expect(safeToISOString(bad)).toBeNull();
  });

  it("safeToISOString returns ISO string for valid date", () => {
    const d = new Date("2026-02-08T00:00:00.000Z");
    expect(safeToISOString(d)).toBe("2026-02-08T00:00:00.000Z");
  });

  it('fmtLocalDateTimeSR returns "—" for null or invalid', () => {
    expect(fmtLocalDateTimeSR(null)).toBe("—");
    expect(fmtLocalDateTimeSR("nope")).toBe("—");
  });

  it("fmtLocalDateTimeSR returns non-empty string for valid ISO", () => {
    const out = fmtLocalDateTimeSR("2026-02-08T00:00:00.000Z");
    // samo proverimo da nije fallback.
    expect(out).not.toBe("—");
    expect(out.length).toBeGreaterThan(0);
  });
});
