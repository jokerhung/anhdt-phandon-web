import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const scrypt = promisify(nodeScrypt);
const passwordArg = process.argv[2];
const rl = passwordArg ? null : createInterface({ input: stdin, output: stdout });

try {
  const password = passwordArg ?? await rl.question("Nhập mật khẩu admin (tối thiểu 16 ký tự): ");
  if (password.length < 16) throw new Error("Mật khẩu phải có ít nhất 16 ký tự.");
  const salt = randomBytes(32);
  const derivedKey = await scrypt(password, salt, 64);
  stdout.write(`ADMIN_PASSWORD_HASH=scrypt:v1:${salt.toString("base64url")}:${Buffer.from(derivedKey).toString("base64url")}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "Không thể tạo password hash."}\n`);
  process.exitCode = 1;
} finally {
  rl?.close();
}
