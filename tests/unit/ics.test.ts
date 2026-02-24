import { describe, it, expect } from "vitest";
import { toICSDateTime, escICS } from "@/lib/attendance/ics";

describe("lib/attendance/ics.ts", () => {
  it("toICSDateTime converts ISO to ICS UTC format", () => {
    expect(toICSDateTime("2026-02-08T09:00:00.000Z")).toBe("20260208T090000Z");
    expect(toICSDateTime("2026-12-31T23:59:59.000Z")).toBe("20261231T235959Z");
  });

  it("escICS escapes backslashes, newlines, commas and semicolons", () => {
    const input = "a\\b\nc,d;e";
    const out = escICS(input);
    expect(out).toBe("a\\\\b\\nc\\,d\\;e");
  });

  it("escICS leaves normal text unchanged", () => {
    expect(escICS("hello world")).toBe("hello world");
  });
});
