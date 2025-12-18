import { describe, expect, it } from "vitest";
import { formatKRW, formatDateTime } from "../src/shared/lib/format";

describe("format helpers", () => {
  it("formats KRW with currency suffix", () => {
    expect(formatKRW(123400)).toBe("123,400원");
  });

  it("handles invalid values", () => {
    expect(formatKRW(undefined)).toBe("-");
  });

  it("formats date", () => {
    const formatted = formatDateTime(0);
    expect(formatted).toMatch(/1970/);
  });
});
