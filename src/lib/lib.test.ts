import { describe, expect, it } from "vitest";

import { formatBytes, formatCompact, formatRelative, humanize } from "./format";
import { safeNextPath } from "./navigation";

describe("safeNextPath", () => {
  it.each([
    ["/jobs?page=2", "/jobs?page=2"],
    [null, "/"],
    ["", "/"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["jobs", "/"],
  ])("%s -> %s", (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });
});

describe("format", () => {
  it("humanizes enum values", () => {
    expect(humanize("ACTION_REQUIRED")).toBe("Action required");
  });

  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(4 * 1024 * 1024)).toBe("4.0 MB");
  });

  it("compacts only large numbers", () => {
    expect(formatCompact(9_999)).not.toMatch(/K/);
    expect(formatCompact(45_200)).toMatch(/K/);
  });

  it("describes recent times relatively", () => {
    const now = Date.parse("2026-01-10T12:00:00Z");
    expect(formatRelative("2026-01-10T11:59:50Z", now)).toBe("just now");
    expect(formatRelative("2026-01-10T09:00:00Z", now)).toMatch(/3 hours ago/);
  });
});
