import { describe, expect, it } from "vitest";
import { buildSlip, LabelIndex, naturalCompare, normalizeHeader, parseSheet, summarizePackageRows } from "@/lib/domain";
import fixture from "../../../android/app/src/test/resources/synthetic_parser_fixture.json";

const values = fixture.values as string[][];

describe("domain parity", () => {
  it("normalize header và natural sort giữ tie-break số 0", () => {
    expect(normalizeHeader("﻿ ĐƠN ")).toBe("don");
    expect(["100", "2", "10"].sort(naturalCompare)).toEqual(["2", "10", "100"]);
    expect(["1", "01", "001"].sort(naturalCompare)).toEqual(["1", "01", "001"]);
  });

  it("parse fixture giống Android", () => {
    const parsed = parseSheet(values, "080726");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.headerRow).toBe(1);
    expect(parsed.distributors).toEqual(["DLK", "THC"]);
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.rows[0]).toMatchObject({ lo: "106 THC", kien: "119", sku: "00123" });
    expect(parsed.rows[0].allocations[0].trangThai).toBe("OK SG");
    expect(parsed.rows[1].ton).toBe("");
    expect(parsed.rows[2].allocations.map((item) => item.trangThai)).toEqual(["OK:50, 10 FPT", "OK:30. 30 FPT"]);
  });

  it("index exact lot/package và slip giữ 0, ghi chú, T và tồn", () => {
    const parsed = parseSheet(values, "080726");
    if (!parsed.ok) throw new Error(parsed.message);
    const index = LabelIndex.fromRows(parsed.rows);
    expect(index.lots()).toEqual(["106 THC", "201", "701"]);
    expect(index.rows("701", "680")).toEqual([]);
    const slip = buildSlip("201", "6", parsed.rows, "08/07/2026");
    expect(slip).toMatchObject({ totalSku: 1, unallocated: 61, date: "08/07/2026" });
    expect(slip?.lines).toEqual([
      { sku: "10372", t: "81", khach: "DLK", soLuong: "17", ghiChu: "OK:50, 10 FPT" },
      { sku: "10372", t: "81", khach: "THC", soLuong: "3", ghiChu: "OK:30. 30 FPT" },
    ]);
  });

  it("tổng hợp tổng SL và nhà phân phối của kiện", () => {
    const parsed = parseSheet(values, "080726");
    if (!parsed.ok) throw new Error(parsed.message);
    const summary = summarizePackageRows(LabelIndex.fromRows(parsed.rows).rows("201", "6"));
    expect(summary).toEqual({
      totalQuantity: 81,
      allocatedQuantity: 20,
      stockQuantity: 61,
      distributors: [{ name: "DLK", quantity: 17 }, { name: "THC", quantity: 3 }],
      rowCount: 1,
    });
  });

  it("báo dòng Lô rỗng và không tạo slip chưa phân bổ", () => {
    const bad = values.map((row) => [...row]);
    bad[2][0] = "";
    expect(parseSheet(bad)).toMatchObject({ ok: false, rowNumber: 3 });
    const parsed = parseSheet(values);
    if (!parsed.ok) throw new Error(parsed.message);
    expect(buildSlip("701", "679", parsed.rows)).toBeNull();
  });
});
