import { describe, expect, it } from "vitest";
import { safeInternalRedirect } from "@/lib/auth/redirect";

describe("safeInternalRedirect", () => {
  it("giữ đường dẫn nội bộ", () => {
    expect(safeInternalRedirect("/preview?lot=106%20THC")).toBe("/preview?lot=106%20THC");
  });

  it("từ chối redirect ngoài site", () => {
    expect(safeInternalRedirect("https://evil.example")).toBe("/");
    expect(safeInternalRedirect("//evil.example")).toBe("/");
  });
});
