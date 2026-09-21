import { requireAdminPage } from "@/lib/auth/auth-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdminPage();
  return children;
}
