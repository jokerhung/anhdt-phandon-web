"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, Clock3, FileSpreadsheet, Loader2, Ruler } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { SlipPreview } from "@/components/SlipPreview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Slip } from "@/lib/domain";
import { clearLookupPreference } from "@/lib/lookup-preference";
import { cn } from "@/lib/utils";
import { PRINT_PROFILES, PRINT_PROFILE_LABELS, type PrintProfile } from "@/lib/print-profiles";

interface PreviewQuery { fileId: string; sheetId: string; snapshotId: string; lot: string; packageId: string }
type SlipResponse = { printable: true; slip: Slip; source: { sheetTitle: string }; snapshotId: string; fetchedAt: string } | { printable: false; reason: "UNALLOCATED"; message: string; source: { sheetTitle: string }; snapshotId: string; fetchedAt: string };
type ErrorBody = { error?: string; message?: string };

export function PreviewPage({ query, profile }: { query: PreviewQuery; profile: PrintProfile }) {
  const router = useRouter();
  const [result, setResult] = useState<SlipResponse | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true); setResult(null); setError(null);
      try {
        const params = new URLSearchParams({ fileId: query.fileId, sheetId: query.sheetId, snapshotId: query.snapshotId, lot: query.lot, package: query.packageId });
        const response = await fetch(`/api/slip?${params}`, { signal: controller.signal, cache: "no-store" });
        const body = await response.json() as SlipResponse & ErrorBody;
        if (response.status === 401) { clearLookupPreference(localStorage); router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); router.refresh(); return; }
        if (!response.ok) { setError({ code: body.error ?? "LOAD_ERROR", message: response.status === 409 ? "Dữ liệu xem trước đã hết hạn. Vui lòng quay lại và tải dữ liệu mới." : body.message ?? "Không thể tải phiếu." }); return; }
        setResult(body);
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) setError({ code: "NETWORK_ERROR", message: "Không thể kết nối máy chủ để tải phiếu." });
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [query.fileId, query.lot, query.packageId, query.sheetId, query.snapshotId, router]);

  const profileHref = (nextProfile: PrintProfile) => { const params = new URLSearchParams({ fileId: query.fileId, sheetId: query.sheetId, snapshotId: query.snapshotId, lot: query.lot, package: query.packageId, profile: nextProfile }); return `/preview?${params}`; };
  return (
    <main className={cn("previewPage min-h-svh bg-muted/40 px-4 py-6 sm:px-6 sm:py-10", `printProfile-${profile}`)}>
      <div className="noPrint mx-auto mb-6 w-full max-w-5xl space-y-4">
        <Button variant="ghost" asChild className="-ml-3"><Link href="/"><ArrowLeft /> Quay lại tra cứu</Link></Button>
        <Card>
          <CardHeader className="gap-4 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2"><div className="flex flex-wrap gap-2"><Badge variant="secondary"><FileSpreadsheet className="mr-1 size-3.5" /> {result?.source.sheetTitle ?? "Nguồn dữ liệu"}</Badge><Badge variant="outline"><Ruler className="mr-1 size-3.5" /> {profile.toUpperCase()}</Badge></div><CardTitle className="text-2xl">Xem trước phiếu phân đơn</CardTitle><CardDescription>Phiếu tự fit theo tỷ lệ vào khổ giấy đã chọn, cùng bố cục với preview. Khi Ctrl+P: chọn đúng khổ giấy, lề None và tắt Headers and footers. Dùng Fit to page nếu máy in yêu cầu co vào vùng in được.</CardDescription>{result ? <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock3 className="size-4" /> Dữ liệu lấy lúc {new Date(result.fetchedAt).toLocaleString("vi-VN")}</p> : null}</div>
            {result?.printable ? <PrintButton targetId="print-slip" /> : null}
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Chọn profile in">{PRINT_PROFILES.map((item) => <Button key={item} asChild variant={profile === item ? "default" : "outline"} className="h-auto justify-start whitespace-normal py-3"><Link aria-current={profile === item ? "page" : undefined} href={profileHref(item)}>{profile === item ? <Check /> : <Ruler />}<span className="text-left"><span className="block font-semibold">Profile {item.toUpperCase()}</span><span className={cn("block text-xs", profile === item ? "text-primary-foreground/75" : "text-muted-foreground")}>{PRINT_PROFILE_LABELS[item]}</span></span></Link></Button>)}</nav>
            <p className="text-sm text-muted-foreground">Có thể dùng nút In hoặc Ctrl+P. Trình duyệt không xác nhận chắc chắn giấy đã in thành công.</p>
          </CardContent>
        </Card>
        {loading ? <Alert><Loader2 className="animate-spin" /><AlertTitle>Đang dựng phiếu</AlertTitle><AlertDescription>Đang xác thực snapshot và tải dữ liệu phiếu…</AlertDescription></Alert> : null}
        {error ? <Alert variant="destructive"><AlertCircle /><AlertTitle>Không thể xem trước</AlertTitle><AlertDescription>{error.message} <Button asChild variant="link" className="h-auto p-0"><Link href="/">Quay lại tra cứu</Link></Button></AlertDescription></Alert> : null}
        {result && !result.printable ? <Alert variant="destructive"><AlertCircle /><AlertTitle>Kiện chưa được phân bổ</AlertTitle><AlertDescription>Không tạo phiếu in cho kiện này. Hãy quay lại chọn kiện khác hoặc cập nhật nguồn dữ liệu.</AlertDescription></Alert> : null}
      </div>
      {result?.printable ? <div className="slipViewport" role="region" aria-label="Vùng xem phiếu; cuộn ngang nếu màn hình hẹp" tabIndex={0}><SlipPreview id="print-slip" slip={result.slip} className="printSlip" label="Phiếu phân đơn" /></div> : <div className="printInvalidMessage">Không có phiếu hợp lệ để in.</div>}
    </main>
  );
}
