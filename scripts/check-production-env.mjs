const required = ["ADMIN_USERNAME", "ADMIN_PASSWORD_HASH", "APP_ORIGIN", "GOOGLE_APPLICATION_CREDENTIALS"];
const errors = [];
for (const key of required) if (!process.env[key]?.trim()) errors.push(`${key} is required`);
if (process.env.ADMIN_USERNAME?.trim().toLowerCase() === "admin") errors.push("ADMIN_USERNAME must not use the default 'admin'");
try {
  const origin = new URL(process.env.APP_ORIGIN ?? "");
  if (origin.protocol !== "https:") errors.push("APP_ORIGIN must use https in production");
  if (origin.pathname !== "/" || origin.search || origin.hash) errors.push("APP_ORIGIN must be an origin only");
} catch { errors.push("APP_ORIGIN must be a valid URL"); }
if (!/^scrypt:v1:[A-Za-z0-9_-]{43}:[A-Za-z0-9_-]{86}$/.test(process.env.ADMIN_PASSWORD_HASH ?? "")) errors.push("ADMIN_PASSWORD_HASH has an invalid format");
if (!process.env.DEPLOYMENT_VERSION?.trim()) errors.push("DEPLOYMENT_VERSION is required for traceable production releases");
if (process.env.TRUST_PROXY !== "true") errors.push("TRUST_PROXY=true is required behind the documented reverse proxy");
if (errors.length) {
  console.error("Production environment check failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("Production environment check passed (secret values were not printed).");
