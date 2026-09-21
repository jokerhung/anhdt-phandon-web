import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileText, Ruler } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/auth/auth-service";
import { cn } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rows = [
  ["SP-001", "12", "Cửa hàng Hà Nội", "6", "Giao buổi sáng"],
  ["SP-001", "12", "Đại lý Minh Anh", "6", "Kiểm tra kỹ tem trước khi giao"],
  ["SP-025", "8", "Kho Đà Nẵng", "0", "Số lượng 0 vẫn phải hiển thị"],
  ["SP-106", "20", "Khách lẻ", "5", "Ghi chú dài để kiểm tra việc xuống dòng tiếng Việt, dấu và chiều cao thực tế của phiếu khi xuất PDF hoặc in giấy."],
];

export default async function PrintSpikePage({ searchParams }: { searchParams: Promise<{ profile?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const profile = (await searchParams).profile === "a4" ? "a4" : "a7";
  await requireAdminPage(`/print-spike?profile=${profile}`);

  return (
    <main className={cn("printSpikePage min-h-svh bg-muted/40 px-4 py-6 sm:px-6 sm:py-10", `printProfile-${profile}`)}>
      <div className="noPrint mx-auto mb-6 w-full max-w-5xl space-y-4">
        <Button variant="ghost" asChild className="-ml-3">
          <Link href="/"><ArrowLeft /> Quay lại tra cứu</Link>
        </Button>
        <Card>
          <CardHeader className="gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary"><FileText className="mr-1 size-3.5" /> Prototype in</Badge>
                <Badge variant="outline"><Ruler className="mr-1 size-3.5" /> Scale 100%</Badge>
              </div>
              <CardTitle className="text-2xl">Thử in phiếu {profile.toUpperCase()}</CardTitle>
              <CardDescription>{profile === "a7" ? "A7 dọc 74 × 105 mm." : "A4 chứa phiếu A7 kích thước thật, không kéo giãn."} Tắt header/footer của trình duyệt trước khi in.</CardDescription>
            </div>
            <PrintButton />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <nav className="grid gap-3 sm:grid-cols-2" aria-label="Chọn profile in">
              {(["a7", "a4"] as const).map((item) => {
                const selected = profile === item;
                return (
                  <Button key={item} asChild variant={selected ? "default" : "outline"} className="h-auto min-w-0 justify-start whitespace-normal px-3 py-3 sm:px-4">
                    <Link aria-current={selected ? "page" : undefined} href={`/print-spike?profile=${item}`}>
                      {selected ? <Check /> : <Ruler />}
                      <span className="text-left"><span className="block font-semibold">Profile {item.toUpperCase()}</span><span className={cn("block text-xs", selected ? "text-primary-foreground/75" : "text-muted-foreground")}>{item === "a7" ? "Trang 74 × 105 mm" : "Phiếu A7 trên trang 210 × 297 mm"}</span></span>
                    </Link>
                  </Button>
                );
              })}
            </nav>
            <p className="mt-4 text-sm text-muted-foreground">Trên điện thoại, chức năng in phụ thuộc trình duyệt và dịch vụ in của thiết bị. Dùng Chrome/Edge trên PC để kiểm tra khổ giấy và tỷ lệ in.</p>
          </CardContent>
        </Card>
      </div>

      <div className="slipViewport" role="region" aria-label="Vùng xem phiếu; cuộn ngang nếu màn hình hẹp" tabIndex={0}>
      <article className="slip shadow-xl shadow-black/10 print:shadow-none" aria-label="Phiếu phân đơn thử nghiệm">
        <header className="slipTitle">
          <div><strong>LÔ:</strong> 106 THC</div>
          <div><strong>KIỆN:</strong> 00123</div>
        </header>
        <table>
          <thead><tr><th>SKU</th><th>T</th><th>KHÁCH</th><th>SL</th><th>GHI CHÚ</th></tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
        </table>
        <footer className="slipFooter">
          <span>Ngày: 21/09/2026</span><span>Tổng SKU: 3</span><span>Tồn: 9</span>
        </footer>
      </article>
      </div>
    </main>
  );
}
