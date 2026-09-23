import { requireAdminPage, getSessionTiming } from "@/lib/auth/auth-service";
import { SessionSheetRefresh } from "@/components/SessionSheetRefresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdminPage();
  const timing = await getSessionTiming();
  return timing ? <SessionSheetRefresh {...timing}>{children}</SessionSheetRefresh> : children;
}
