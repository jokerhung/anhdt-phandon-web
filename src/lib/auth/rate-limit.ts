import "server-only";

interface Bucket {
  failures: number[];
}

export class LoginRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit = 5,
    private readonly windowMs = 15 * 60 * 1000,
    private readonly globalLimit = 100,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): { allowed: boolean; retryAfterSeconds?: number } {
    this.prune();
    const failures = this.buckets.get(key)?.failures ?? [];
    const allFailures = [...this.buckets.values()].reduce((sum, bucket) => sum + bucket.failures.length, 0);
    if (failures.length < this.limit && allFailures < this.globalLimit) return { allowed: true };

    const oldest = failures[0] ?? this.now();
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + this.windowMs - this.now()) / 1000)) };
  }

  recordFailure(key: string): void {
    this.prune();
    const bucket = this.buckets.get(key) ?? { failures: [] };
    bucket.failures.push(this.now());
    this.buckets.set(key, bucket);
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  private prune(): void {
    const cutoff = this.now() - this.windowMs;
    for (const [key, bucket] of this.buckets) {
      bucket.failures = bucket.failures.filter((timestamp) => timestamp > cutoff);
      if (bucket.failures.length === 0) this.buckets.delete(key);
    }
  }
}
