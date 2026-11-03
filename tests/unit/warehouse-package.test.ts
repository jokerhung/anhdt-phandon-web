import { describe, expect, it } from "vitest";
import { nextWarehousePackageCode } from "@/lib/domain";

const row = (kienKho: string) => ({
  lo: "1", kien: "1", kienKho, sku: "SKU", moTa: "", tenSheet: "Tab", slSheet: "1", ton: "1", allocations: [],
});

describe("warehouse package sequence", () => {
  it("starts at 1A1 and advances through A1-A8", () => {
    expect(nextWarehousePackageCode([])).toBe("1A1");
    expect(nextWarehousePackageCode([row("1A1"), row("1A7")])).toBe("1A8");
    expect(nextWarehousePackageCode([row("1A8")])).toBe("2A1");
  });

  it("ignores blank and unrelated Kiện kho values", () => {
    expect(nextWarehousePackageCode([row(""), row("old-code"), row("10A3")])).toBe("10A4");
  });
});
