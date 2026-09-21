import "server-only";
import { verifyPasswordHash } from "@/lib/auth/password-hash";

const MAX_CONCURRENT_CHECKS = 4;

let activeChecks = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeChecks < MAX_CONCURRENT_CHECKS) {
    activeChecks += 1;
    return;
  }
  await new Promise<void>((resolve) => waiters.push(resolve));
  activeChecks += 1;
}

function releaseSlot(): void {
  activeChecks -= 1;
  waiters.shift()?.();
}

export interface PasswordVerifier {
  verify(candidate: string): Promise<boolean>;
}

export function createPasswordVerifier(passwordHash: string): PasswordVerifier {
  return {
    async verify(candidate: string): Promise<boolean> {
      await acquireSlot();
      try {
        return await verifyPasswordHash(candidate, passwordHash);
      } finally {
        releaseSlot();
      }
    },
  };
}
