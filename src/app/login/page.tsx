import { redirect } from "next/navigation";
import { PackageSearch, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAdminSession } from "@/lib/auth/auth-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await hasAdminSession()) redirect("/");

  return (
    <main className="loginPage relative grid min-h-svh place-items-center bg-muted/40 px-4 py-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--accent),transparent_65%)]" />
      <div className="relative w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3 text-primary">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <PackageSearch className="size-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]">UGREEN</p>
            <p className="font-semibold text-foreground">Hệ thống phân đơn</p>
          </div>
        </div>
        <Card className="border-border/70 shadow-xl shadow-black/5">
          <CardHeader className="space-y-3 px-4 text-center sm:px-6">
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <CardTitle id="login-title" className="text-2xl">Đăng nhập quản trị</CardTitle>
            <CardDescription>Sử dụng tài khoản được cấu hình an toàn trên máy chủ.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <LoginForm />
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">Phiên đăng nhập có thời hạn và được bảo vệ bằng cookie HttpOnly.</p>
      </div>
    </main>
  );
}
