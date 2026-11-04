import { describe, expect, it } from "vitest";
import { sameRows } from "@/lib/domain/same-rows";
import type { SheetRow } from "@/lib/domain/types";

const row = (sku: string, soLuong = ""): SheetRow => ({ lo: "1401", kien: "7", kienKho: "", sku, moTa: "", tenSheet: "x", slSheet: "5", ton: "0", allocations: [{ khach: "ADC", soLuong, trangThai: "" }] });

describe("sameRows", () => {
  it("ignores row order after a sheet sort/filter", () => {
    expect(sameRows([row("A", "1"), row("B", "2")], [row("B", "2"), row("A", "1")])).toBe(true);
  });
  it("still detects real changes", () => {
    expect(sameRows([row("A", "1")], [row("A", "2")])).toBe(false);
    expect(sameRows([row("A")], [row("A"), row("B")])).toBe(false);
  });
});
