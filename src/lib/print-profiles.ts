export const PRINT_PROFILES = ["a6", "a7", "a4"] as const;
export type PrintProfile = typeof PRINT_PROFILES[number];

export const PRINT_PROFILE_LABELS: Record<PrintProfile, string> = {
  a7: "A7 ngang · 105 × 74 mm",
  a6: "A6 ngang · 150 × 100 mm (tùy chỉnh)",
  a4: "A4 ngang · 297 × 210 mm",
};

export function parsePrintProfile(value: string | undefined): PrintProfile {
  return value === "a7" || value === "a4" ? value : "a6";
}
