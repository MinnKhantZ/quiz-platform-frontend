import { describe, it, expect } from "vitest";
import { formatTime, formatDate, cn } from "../../src/lib/utils";

describe("formatTime", () => {
  it("formats zero seconds", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("formats under a minute", () => {
    expect(formatTime(45)).toBe("0:45");
  });

  it("pads seconds with leading zero", () => {
    expect(formatTime(65)).toBe("1:05");
  });

  it("formats multiple minutes", () => {
    expect(formatTime(3600)).toBe("60:00");
  });
});

describe("formatDate", () => {
  it("returns a non-empty string", () => {
    const result = formatDate("2024-06-01T12:00:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the year", () => {
    const result = formatDate("2024-06-01T12:00:00Z");
    expect(result).toContain("2024");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "off", "on")).toBe("base on");
  });

  it("deduplicates tailwind utility conflicts", () => {
    // twMerge should keep the last conflicting class
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });
});
