import { jsonNoStore } from "@/lib/server/api";
import { getEnv } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const env = getEnv();
    return jsonNoStore({ status: "ok", service: "ugreen-phan-don-web", version: env.DEPLOYMENT_VERSION ?? "unknown" });
  } catch {
    return jsonNoStore({ status: "error", service: "ugreen-phan-don-web" }, 503);
  }
}
