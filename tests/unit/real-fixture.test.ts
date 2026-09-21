import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSlip, LabelIndex, parseSheet, toIntOrZero } from "@/lib/domain";

const snapshot = JSON.parse(readFileSync(resolve(process.cwd(), "../android/app/src/test/resources/real_values_080726.snapshot.json"), "utf8")) as { sheetTitle: string; valuesResponse: { values: string[][] } };

describe("real Android fixture parity", () => {
  it("đạt invariant parser và lookup production", () => {
    const parsed = parseSheet(snapshot.valuesResponse.values, snapshot.sheetTitle);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.rows).toHaveLength(1422);
    expect(parsed.rows.filter((row) => row.lo === "106 THC")).toHaveLength(200);
    expect(parsed.distributors).toHaveLength(25);
    expect(parsed.distributors).not.toEqual(expect.arrayContaining(["Tồn", "KIỆN", "VÀO VL"]));
    expect(parsed.rows.every((row) => toIntOrZero(row.slSheet) === row.allocations.reduce((sum, item) => sum + toIntOrZero(item.soLuong), 0) + toIntOrZero(row.ton))).toBe(true);
    const index = LabelIndex.fromRows(parsed.rows);
    expect(index.lots()).toEqual(["106 THC", "201", "701"]);
    expect(index.packages("701")).toHaveLength(1187);
    expect(index.rows("106 THC", "165")).toHaveLength(4);
  });

  it("mọi slip giữ order/balance, có 79 kiện chưa phân bổ và phiếu 4 SKU", () => {
    const parsed = parseSheet(snapshot.valuesResponse.values, snapshot.sheetTitle);
    if (!parsed.ok) throw new Error(parsed.message);
    const index = LabelIndex.fromRows(parsed.rows);
    let empty = 0; let fourSku = 0;
    for (const lot of index.lots()) for (const packageId of index.packages(lot)) {
      const rows = index.rows(lot, packageId);
      const slip = buildSlip(lot, packageId, rows);
      if (!slip) { empty += 1; expect(rows.every((row) => row.allocations.every((a) => a.soLuong.trim() === ""))).toBe(true); continue; }
      expect(slip.lines.reduce((sum, line) => sum + toIntOrZero(line.soLuong), 0) + slip.unallocated).toBe(rows.reduce((sum, row) => sum + toIntOrZero(row.slSheet), 0));
      if (slip.totalSku === 4) fourSku += 1;
    }
    expect(empty).toBe(79);
    expect(fourSku).toBeGreaterThan(0);
  });
});
