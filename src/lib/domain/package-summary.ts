import { toIntOrZero } from "@/lib/domain/text";
import type { SheetRow } from "@/lib/domain/types";

export interface PackageDistributorSummary {
  name: string;
  quantity: number;
}

export interface PackageSummaryData {
  totalQuantity: number;
  allocatedQuantity: number;
  stockQuantity: number;
  distributors: PackageDistributorSummary[];
  rowCount: number;
}

export function summarizePackageRows(rows: SheetRow[]): PackageSummaryData {
  const distributors = new Map<string, PackageDistributorSummary>();
  let totalQuantity = 0;
  let allocatedQuantity = 0;
  let stockQuantity = 0;
  for (const row of rows) {
    totalQuantity += toIntOrZero(row.slSheet);
    stockQuantity += toIntOrZero(row.ton);
    for (const allocation of row.allocations) {
      if (allocation.soLuong.trim() === "") continue;
      const quantity = toIntOrZero(allocation.soLuong);
      allocatedQuantity += quantity;
      const current = distributors.get(allocation.khach) ?? { name: allocation.khach, quantity: 0 };
      current.quantity += quantity;
      distributors.set(allocation.khach, current);
    }
  }
  return { totalQuantity, allocatedQuantity, stockQuantity, distributors: [...distributors.values()], rowCount: rows.length };
}
