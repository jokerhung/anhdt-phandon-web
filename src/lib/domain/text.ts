export function normalizeHeader(value: string): string {
  return value
    .trim()
    .replace(/^\uFEFF/, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "D")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .trim()
    .toLowerCase();
}

const chunks = /\d+|\D+/g;

export function naturalCompare(left: string, right: string): number {
  const a = left.match(chunks) ?? [];
  const b = right.match(chunks) ?? [];
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    const x = a[index];
    const y = b[index];
    let comparison: number;
    if (/^\d/.test(x) && /^\d/.test(y)) {
      const xx = x.replace(/^0+/, "") || "0";
      const yy = y.replace(/^0+/, "") || "0";
      comparison = xx.length - yy.length || xx.localeCompare(yy) || x.length - y.length;
    } else {
      const lowerX = x.toLowerCase();
      const lowerY = y.toLowerCase();
      comparison = lowerX < lowerY ? -1 : lowerX > lowerY ? 1 : 0;
    }
    if (comparison !== 0) return comparison;
  }
  if (a.length !== b.length) return a.length - b.length;
  return left < right ? -1 : left > right ? 1 : 0;
}

export function toIntOrZero(value: string | null | undefined): number {
  const trimmed = value?.trim() ?? "";
  return /^-?\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : 0;
}
