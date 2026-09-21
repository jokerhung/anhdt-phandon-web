import { naturalCompare } from "@/lib/domain/text";
import type { SheetRow } from "@/lib/domain/types";

export class LabelIndex {
  private constructor(private readonly index: Map<string, Map<string, SheetRow[]>>) {}

  static fromRows(rows: SheetRow[]): LabelIndex {
    const index = new Map<string, Map<string, SheetRow[]>>();
    for (const row of rows) {
      const lots = index.get(row.lo) ?? new Map<string, SheetRow[]>();
      const packages = lots.get(row.kien) ?? [];
      packages.push(row);
      lots.set(row.kien, packages);
      index.set(row.lo, lots);
    }
    return new LabelIndex(index);
  }

  lots(): string[] { return [...this.index.keys()].sort(naturalCompare); }
  packages(lot: string): string[] { return [...(this.index.get(lot)?.keys() ?? [])].sort(naturalCompare); }
  rows(lot: string, packageId: string): SheetRow[] { return this.index.get(lot)?.get(packageId) ?? []; }
}
