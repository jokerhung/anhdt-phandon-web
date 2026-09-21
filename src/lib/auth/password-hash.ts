import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;
const PREFIX = "scrypt";
const VERSION = "v1";
const SEPARATOR = ":";

export const PASSWORD_HASH_PATTERN = /^scrypt:v1:[A-Za-z0-9_-]{43}:[A-Za-z0-9_-]{86}$/;

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 16) throw new Error("Mật khẩu phải có ít nhất 16 ký tự.");
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return [PREFIX, VERSION, salt.toString("base64url"), derivedKey.toString("base64url")].join(SEPARATOR);
}

export async function verifyPasswordHash(candidate: string, encodedHash: string): Promise<boolean> {
  const parts = encodedHash.split(SEPARATOR);
  if (parts.length !== 4 || parts[0] !== PREFIX || parts[1] !== VERSION) return false;

  try {
    const salt = Buffer.from(parts[2], "base64url");
    const expected = Buffer.from(parts[3], "base64url");
    if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;
    const actual = (await scrypt(candidate, salt, expected.length)) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
