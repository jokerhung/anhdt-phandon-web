import type { SheetRow } from "@/lib/domain/types";

/**
 * Compare two sets of package rows ignoring their order. Sorting or filtering
 * the sheet with a sort rule physically reorders rows without changing data, so
 * order alone must not count as "package data changed".
 */
export function sameRows(a: SheetRow[], b: SheetRow[]): boolean {
  if (a.length !== b.length) return false;
  const key = (rows: SheetRow[]) => rows.map((row) => JSON.stringify(row)).sort();
  const left = key(a);
  const right = key(b);
  return left.every((value, index) => value === right[index]);
}
