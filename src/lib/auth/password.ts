import "server-only";
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;
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

export async function createPasswordVerifier(password: string): Promise<PasswordVerifier> {
  const salt = randomBytes(32);
  const expected = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return {
    async verify(candidate: string): Promise<boolean> {
      await acquireSlot();
      try {
        const actual = (await scrypt(candidate, salt, KEY_LENGTH)) as Buffer;
        return actual.length === expected.length && timingSafeEqual(actual, expected);
      } finally {
        releaseSlot();
      }
    },
  };
}
