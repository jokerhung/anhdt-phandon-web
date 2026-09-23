import "server-only";

// Cache only successful metadata responses; bound memory and coalesce requests.
// Each Google client has its own namespace (including injected test clients).
class MetadataCache {
  private values = new Map<string, { value: unknown; expires: number }>();
  private pending = new Map<string, Promise<unknown>>();

  async get<T>(key: string, load: () => Promise<T>, force = false): Promise<T> {
    const pending = this.pending.get(key);
    if (pending) return pending as Promise<T>;
    const cached = this.values.get(key);
    if (!force && cached && cached.expires > Date.now()) return cached.value as T;
    this.values.delete(key);
    const task = Promise.resolve().then(load).then((value) => {
      if (this.values.size >= 100) this.values.delete(this.values.keys().next().value!);
      this.values.set(key, { value, expires: Date.now() + 300_000 });
      return value;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, task);
    return task;
  }
}

const caches = new WeakMap<object, MetadataCache>();
export function metadataCache(client: object): MetadataCache {
  let cache = caches.get(client);
  if (!cache) { cache = new MetadataCache(); caches.set(client, cache); }
  return cache;
}
