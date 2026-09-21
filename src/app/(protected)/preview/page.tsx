import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PreviewPlaceholder({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const complete = ["fileId", "sheetId", "snapshotId", "lot", "package"].every((key) => typeof query[key] === "string" && query[key] !== "");
  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader><Construction className="size-9 text-primary" /><CardTitle>{complete ? "Dữ liệu xem trước đã sẵn sàng" : "Thiếu thông tin xem trước"}</CardTitle><CardDescription>{complete ? "Phase 03 đã chuyển đúng lựa chọn sang URL. Nội dung phiếu hoàn chỉnh sẽ được triển khai trong Phase 04." : "Vui lòng quay lại và chọn đầy đủ File, Sheet, Lô và Kiện."}</CardDescription></CardHeader>
        <CardContent><Button asChild variant="outline"><Link href="/"><ArrowLeft /> Quay lại tra cứu</Link></Button></CardContent>
      </Card>
    </main>
  );
}
