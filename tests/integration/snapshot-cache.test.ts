import { describe, expect, it, vi } from "vitest";
import { SnapshotCache } from "@/lib/server/snapshot-cache";

const rows = [["Lô", "KIỆN", "SKU", "SL", "KH", "", "", "", "Tồn"], ["1", "001", "SKU", "1", "1", "OK", "", "", "0"]];

describe("SnapshotCache", () => {
  it("gộp request, dùng TTL và refresh publish snapshot mới", async () => {
    let now = 1_700_000_000_000;
    const readValues = vi.fn().mockResolvedValue({ title: "Tab", rows });
    const cache = new SnapshotCache({ readValues } as never, { ttlSeconds: 60, retentionSeconds: 300, now: () => now });
    const [first, same] = await Promise.all([cache.getOrLoad("file", 1), cache.getOrLoad("file", 1)]);
    expect(first.id).toBe(same.id); expect(readValues).toHaveBeenCalledTimes(1);
    expect((await cache.getOrLoad("file", 1)).id).toBe(first.id);
    now += 61_000;
    const refreshedByTtl = await cache.getOrLoad("file", 1);
    expect(refreshedByTtl.id).not.toBe(first.id);
    const forced = await cache.refresh("file", 1);
    expect(forced.id).not.toBe(refreshedByTtl.id);
  });

  it("refresh lỗi không thay snapshot tốt và snapshot hết retention trả expired", async () => {
    let now = 1_700_000_000_000;
    const readValues = vi.fn().mockResolvedValueOnce({ title: "Tab", rows }).mockRejectedValueOnce(new Error("network"));
    const cache = new SnapshotCache({ readValues } as never, { ttlSeconds: 60, retentionSeconds: 300, now: () => now });
    const first = await cache.getOrLoad("file", 1);
    await expect(cache.refresh("file", 1)).rejects.toThrow("network");
    expect(cache.getSnapshot("file", 1, first.id).id).toBe(first.id);
    now += 301_000;
    expect(() => cache.getSnapshot("file", 1, first.id)).toThrow();
  });
});
