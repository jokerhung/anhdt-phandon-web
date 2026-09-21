import { setTimeout as delay } from "node:timers/promises";

export async function withGoogleRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await operation(); } catch (error) {
      lastError = error;
      const status = typeof error === "object" && error !== null && "code" in error ? Number((error as { code: unknown }).code) : 0;
      if (![429, 500, 502, 503, 504].includes(status) || attempt === attempts - 1) throw error;
      await delay(150 * 2 ** attempt);
    }
  }
  throw lastError;
}
