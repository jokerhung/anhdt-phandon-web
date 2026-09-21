import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSpreadsheet, PackageSearch, Printer, ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-svh bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <PackageSearch className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Phân đơn</p>
              <h1 className="text-lg font-semibold">Tra cứu kiện</h1>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-12">
        <section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-4 shadow-sm sm:p-8">
          <div className="max-w-2xl space-y-4">
            <Badge variant="secondary" className="gap-1.5"><CheckCircle2 className="size-3.5" /> Phase 01 hoàn tất</Badge>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Nền tảng đã sẵn sàng</h2>
              <p className="text-muted-foreground">Đăng nhập, bảo vệ truy cập và prototype in đã được thiết lập. Kết nối Google Sheets sẽ được bổ sung trong Phase 02.</p>
            </div>
            {process.env.NODE_ENV === "development" ? (
              <Button asChild className="w-full whitespace-normal text-left sm:w-auto">
                <Link href="/print-spike">Mở trang thử in A7/A4 <ArrowRight /></Link>
              </Button>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Các chức năng hiện có">
          <Card>
            <CardHeader>
              <ShieldCheck className="size-8 text-primary" />
              <CardTitle className="text-lg">Xác thực an toàn</CardTitle>
              <CardDescription>Session phía server, cookie HttpOnly và giới hạn đăng nhập sai.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <FileSpreadsheet className="size-8 text-primary" />
              <CardTitle className="text-lg">Google Sheets</CardTitle>
              <CardDescription>Sẵn sàng tích hợp danh sách file, tab, lô và kiện ở phase tiếp theo.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Printer className="size-8 text-primary" />
              <CardTitle className="text-lg">In A7 và A4</CardTitle>
              <CardDescription>Prototype giữ đúng kích thước phiếu, hỗ trợ Ctrl+P và PDF.</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Luồng nghiệp vụ dự kiến</CardTitle>
            <CardDescription>Chuỗi thao tác sẽ được hoàn thiện xuyên suốt các phase tiếp theo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3 text-sm font-medium sm:grid-cols-2 lg:grid-cols-4" aria-label="Quy trình phân đơn">
              {["Đăng nhập", "Chọn file", "Chọn sheet", "Chọn lô", "Chọn kiện", "Xem trước", "In"].map((step, index) => (
                <li key={step} className="flex min-w-0 items-center gap-3 rounded-lg border bg-background p-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden="true">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
