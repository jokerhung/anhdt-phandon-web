import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { parseEnv } from "node:util";

// Next chooses its listening port before loading .env. Load only PORT early,
// leaving all other variables to Next's normal environment precedence rules.
if (process.env.PORT === undefined) {
  try {
    const { PORT } = parseEnv(readFileSync(new URL("../.env", import.meta.url), "utf8"));
    if (PORT !== undefined) process.env.PORT = PORT;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

// Keep argv intact: explicit --port/-p still overrides the environment.
const require = createRequire(import.meta.url);
require("next/dist/bin/next");
