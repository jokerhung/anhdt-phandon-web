import { describe, expect, it } from "vitest";
import { clearLookupPreference, LOOKUP_PREFERENCE_KEY, readLookupPreference, saveLookupPreference } from "@/lib/lookup-preference";

function storage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

describe("lookup preference", () => {
  it("lưu và đọc lại fileId/sheetId, không lưu tên hay snapshot", () => {
    const store = storage();
    saveLookupPreference(store, { fileId: "abc_X-1", sheetId: 42 });
    expect(readLookupPreference(store)).toEqual({ fileId: "abc_X-1", sheetId: 42 });
    expect(store.getItem(LOOKUP_PREFERENCE_KEY)).not.toContain("snapshot");
  });

  it("xóa dữ liệu hỏng và hỗ trợ clear khi logout", () => {
    const store = storage();
    store.setItem(LOOKUP_PREFERENCE_KEY, JSON.stringify({ fileId: "bad id", sheetId: -1 }));
    expect(readLookupPreference(store)).toBeNull();
    store.setItem(LOOKUP_PREFERENCE_KEY, JSON.stringify({ fileId: "valid" }));
    clearLookupPreference(store);
    expect(readLookupPreference(store)).toBeNull();
  });
});
