export interface Allocation {
  khach: string;
  soLuong: string;
  trangThai: string;
}

export interface SheetRow {
  lo: string;
  kien: string;
  sku: string;
  moTa: string;
  tenSheet: string;
  slSheet: string;
  ton: string;
  allocations: Allocation[];
}

export interface ParseSuccess {
  ok: true;
  rows: SheetRow[];
  distributors: string[];
  headerRow: number;
}

export interface ParseFailure {
  ok: false;
  message: string;
  rowNumber?: number;
}

export type ParseResult = ParseSuccess | ParseFailure;

export interface SlipLine {
  sku: string;
  t: string;
  khach: string;
  soLuong: string;
  ghiChu: string;
}

export interface Slip {
  lo: string;
  kien: string;
  lines: SlipLine[];
  unallocated: number;
  totalSku: number;
  date?: string;
}
