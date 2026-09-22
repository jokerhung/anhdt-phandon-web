import type { NextConfig } from "next";

const scriptPolicy = process.env.NODE_ENV === "development" ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; ${scriptPolicy}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com` },
];

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  // Auth's origin allowlist does not configure Next's separate dev/HMR guard.
  allowedDevOrigins: [...new Set([process.env.APP_ORIGIN, ...(process.env.ALLOWED_ORIGINS ?? "").split(",")]
    .filter((origin): origin is string => Boolean(origin?.trim()))
    .map((origin) => new URL(origin.trim()).hostname))],
  poweredByHeader: false,
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  deploymentId: process.env.DEPLOYMENT_VERSION,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
