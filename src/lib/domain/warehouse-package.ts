import type { SheetRow } from "@/lib/domain/types";

const WAREHOUSE_PACKAGE_PATTERN = /^(\d+)A([1-8])$/i;

/** Return the next warehouse carton code in the sequence 1A1 ... 1A8, 2A1 ... */
export function nextWarehousePackageCode(rows: SheetRow[]): string {
  let highest = 0;
  for (const row of rows) {
    const match = row.kienKho.trim().match(WAREHOUSE_PACKAGE_PATTERN);
    if (!match) continue;
    const carton = Number(match[1]);
    const slot = Number(match[2]);
    if (Number.isSafeInteger(carton) && carton > 0) highest = Math.max(highest, (carton - 1) * 8 + slot);
  }
  const next = highest + 1;
  const carton = Math.floor((next - 1) / 8) + 1;
  const slot = ((next - 1) % 8) + 1;
  return `${carton}A${slot}`;
}
