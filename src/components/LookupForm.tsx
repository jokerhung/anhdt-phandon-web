"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, FileSpreadsheet, Loader2, Package, RefreshCw, RotateCcw } from "lucide-react";
import { SearchableSelect, type SelectOption } from "@/components/SearchableSelect";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type FileDto = { id: string; name: string; modifiedTime: string };
type SheetDto = { sheetId: number; title: string };
type ApiError = { error?: string; message?: string };

type LoadingKey = "files" | "sheets" | "lots" | "packages" | "refresh";
const initialLoading: Record<LoadingKey, boolean> = { files: false, sheets: false, lots: false, packages: false, refresh: false };

export function LookupForm() {
  const router = useRouter();
  const controllers = useRef(new Map<LoadingKey, AbortController>());
  const requestIds = useRef(new Map<LoadingKey, number>());
  const [files, setFiles] = useState<FileDto[]>([]); const [sheets, setSheets] = useState<SheetDto[]>([]); const [lots, setLots] = useState<string[]>([]); const [packages, setPackages] = useState<string[]>([]);
  const [fileId, setFileId] = useState(""); const [sheetId, setSheetId] = useState(""); const [lot, setLot] = useState(""); const [packageId, setPackageId] = useState("");
  const [snapshotId, setSnapshotId] = useState(""); const [fetchedAt, setFetchedAt] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(initialLoading);
  const [open, setOpen] = useState({ file: false, sheet: false, lot: false, package: false });

  const setBusy = (key: LoadingKey, value: boolean) => setLoading((current) => ({ ...current, [key]: value }));
  const resetAfterFile = () => { setSheetId(""); setSheets([]); setLot(""); setLots([]); setPackageId(""); setPackages([]); setSnapshotId(""); setFetchedAt(""); };
  const resetAfterSheet = () => { setLot(""); setLots([]); setPackageId(""); setPackages([]); setSnapshotId(""); setFetchedAt(""); };
  const resetAfterLot = () => { setPackageId(""); setPackages([]); };

  const request = useCallback(async <T,>(key: LoadingKey, url: string, init?: RequestInit): Promise<T | null> => {
    controllers.current.get(key)?.abort(); const controller = new AbortController(); controllers.current.set(key, controller);
    const id = (requestIds.current.get(key) ?? 0) + 1; requestIds.current.set(key, id); setBusy(key, true); setError("");
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const body = await response.json() as T & ApiError;
      if (requestIds.current.get(key) !== id) return null;
      if (response.status === 401) { sessionStorage.clear(); router.replace("/login"); router.refresh(); return null; }
      if (!response.ok) throw new Error(response.status === 409 ? "Dữ liệu đã hết hạn. Vui lòng tải lại." : body.message ?? "Không thể tải dữ liệu.");
      return body;
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return null;
      if (requestIds.current.get(key) === id) setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu.");
      return null;
    } finally { if (requestIds.current.get(key) === id) setBusy(key, false); }
  }, [router]);

  const loadFiles = useCallback(async () => {
    setFiles([]); resetAfterFile();
    const result = await request<{ files: FileDto[] }>("files", "/api/files"); if (result) setFiles(result.files);
  }, [request]);

  useEffect(() => {
    const activeControllers = controllers.current;
    const timer = window.setTimeout(() => void loadFiles(), 0);
    return () => { window.clearTimeout(timer); activeControllers.forEach((controller) => controller.abort()); };
  }, [loadFiles]);

  async function chooseFile(next: string) {
    if (next === fileId) return; setFileId(next); resetAfterFile();
    const result = await request<{ sheets: SheetDto[] }>("sheets", `/api/sheets?fileId=${encodeURIComponent(next)}`); if (result) setSheets(result.sheets);
  }
  async function chooseSheet(next: string) {
    if (next === sheetId) return; setSheetId(next); resetAfterSheet();
    const result = await request<{ lots: string[]; snapshotId: string; fetchedAt: string }>("lots", `/api/lots?fileId=${encodeURIComponent(fileId)}&sheetId=${encodeURIComponent(next)}`);
    if (result) { setLots(result.lots); setSnapshotId(result.snapshotId); setFetchedAt(result.fetchedAt); }
  }
  async function chooseLot(next: string) {
    if (next === lot) return; setLot(next); resetAfterLot();
    const result = await request<{ packages: string[] }>("packages", `/api/packages?fileId=${encodeURIComponent(fileId)}&sheetId=${encodeURIComponent(sheetId)}&snapshotId=${encodeURIComponent(snapshotId)}&lot=${encodeURIComponent(next)}`);
    if (result) setPackages(result.packages);
  }
  async function refresh() {
    if (!fileId || !sheetId) { await loadFiles(); return; }
    const selectedLot = lot; resetAfterSheet();
    const result = await request<{ lots: string[]; snapshotId: string; fetchedAt: string }>("refresh", "/api/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId, sheetId: Number(sheetId) }) });
    if (!result) return; setLots(result.lots); setSnapshotId(result.snapshotId); setFetchedAt(result.fetchedAt);
    if (selectedLot && result.lots.includes(selectedLot)) { setLot(selectedLot); const packageResult = await request<{ packages: string[] }>("packages", `/api/packages?fileId=${encodeURIComponent(fileId)}&sheetId=${encodeURIComponent(sheetId)}&snapshotId=${encodeURIComponent(result.snapshotId)}&lot=${encodeURIComponent(selectedLot)}`); if (packageResult) setPackages(packageResult.packages); }
  }
  function preview() {
    if (!fileId || !sheetId || !snapshotId || !lot || !packageId || Object.values(loading).some(Boolean)) return;
    const query = new URLSearchParams({ fileId, sheetId, snapshotId, lot, package: packageId }); router.push(`/preview?${query.toString()}`);
  }

  const fileOptions: SelectOption[] = files.map((file) => ({ value: file.id, label: file.name, description: file.modifiedTime ? `Cập nhật: ${new Date(file.modifiedTime).toLocaleString("vi-VN")}` : undefined }));
  const sheetOptions = sheets.map((sheet) => ({ value: String(sheet.sheetId), label: sheet.title }));
  const lotOptions = lots.map((item) => ({ value: item, label: item })); const packageOptions = packages.map((item) => ({ value: item, label: item }));
  const valid = Boolean(fileId && sheetId && snapshotId && lot && packageId && packages.includes(packageId)) && !Object.values(loading).some(Boolean);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5"><CardTitle className="flex items-center gap-2"><Package className="size-5 text-primary" /> Tra cứu kiện</CardTitle><CardDescription>Chọn lần lượt nguồn dữ liệu, tab, lô và kiện cần xem trước.</CardDescription></div>
          <div className="flex flex-wrap items-center gap-2"><Badge variant={fetchedAt ? "secondary" : "outline"}>{fetchedAt ? `Đồng bộ ${new Date(fetchedAt).toLocaleString("vi-VN")}` : "Chưa đồng bộ"}</Badge><Button type="button" variant="outline" className="min-h-11" onClick={() => void refresh()} disabled={loading.refresh || loading.files}><RefreshCw className={loading.refresh ? "animate-spin" : ""} /> Làm mới</Button></div>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? <Alert variant="destructive"><AlertCircle /><AlertDescription>{error} <Button type="button" variant="link" className="h-auto p-0 align-baseline" onClick={() => void (fileId && sheetId ? refresh() : loadFiles())}>Thử lại</Button></AlertDescription></Alert> : null}
          {!loading.files && files.length === 0 && !error ? <Alert><FileSpreadsheet /><AlertDescription>Không có file Google Sheets nào trong phạm vi được cấp quyền.</AlertDescription></Alert> : null}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="min-w-0 space-y-2"><Label htmlFor="file-select">File Google Sheets</Label><SearchableSelect id="file-select" value={fileId} options={fileOptions} placeholder="Chọn file Google Sheets" searchPlaceholder="Tìm file…" emptyText="Không tìm thấy file." loading={loading.files} disabled={files.length === 0} searchable open={open.file} onOpenChange={(value) => setOpen((current) => ({ ...current, file: value }))} onChange={(value) => void chooseFile(value)} /></div>
            <div className="min-w-0 space-y-2"><Label htmlFor="sheet-select">Sheet / Tab</Label><SearchableSelect id="sheet-select" value={sheetId} options={sheetOptions} placeholder="Chọn sheet / tab" loading={loading.sheets} disabled={!fileId || sheets.length === 0} searchable={sheets.length > 8} open={open.sheet} onOpenChange={(value) => setOpen((current) => ({ ...current, sheet: value }))} onChange={(value) => void chooseSheet(value)} /></div>
            <div className="min-w-0 space-y-2"><Label htmlFor="lot-select">Lô</Label><SearchableSelect id="lot-select" value={lot} options={lotOptions} placeholder="Chọn lô" loading={loading.lots || loading.refresh} disabled={!sheetId || !snapshotId || lots.length === 0} searchable={lots.length > 8} open={open.lot} onOpenChange={(value) => setOpen((current) => ({ ...current, lot: value }))} onChange={(value) => void chooseLot(value)} /></div>
            <div className="min-w-0 space-y-2"><Label htmlFor="package-select">Kiện</Label><SearchableSelect id="package-select" value={packageId} options={packageOptions} placeholder="Chọn kiện" searchPlaceholder="Tìm mã kiện…" emptyText="Không có kiện phù hợp." loading={loading.packages} disabled={!lot || packages.length === 0} searchable open={open.package} onOpenChange={(value) => setOpen((current) => ({ ...current, package: value }))} onChange={setPackageId} /></div>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => { setFileId(""); setFiles([]); resetAfterFile(); void loadFiles(); }}><RotateCcw /> Chọn lại từ đầu</Button>
            <Button type="button" size="lg" className="min-h-11 w-full sm:w-auto" disabled={!valid} onClick={preview}>{Object.values(loading).some(Boolean) ? <Loader2 className="animate-spin" /> : <Eye />} Xem trước</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
