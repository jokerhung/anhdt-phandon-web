"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  fileId: string;
  sheetId: string;
  snapshotId: string;
  lot: string;
  packageId: string;
  enabled: boolean;
}

export function PrintMarkConfirmation({ enabled, ...selection }: Props) {
  const printStarted = useRef(false);
  const saving = useRef(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [canForce, setCanForce] = useState(false);

  useEffect(() => {
    const beforePrint = () => {
      printStarted.current = enabled && document.getElementById("print-slip")?.dataset.printValid === "true";
    };
    const afterPrint = () => {
      if (printStarted.current) {
        setAwaitingConfirmation(true); setMessage(""); setError(""); setCanForce(false);
      }
      printStarted.current = false;
    };
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      printStarted.current = false;
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, [enabled]);

  const mark = async (force = false) => {
    if (!enabled || saving.current) return;
    saving.current = true;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/mark-printed", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(force ? { ...selection, force: true } : selection),
      });
      const body = await response.json() as { error?: string; markedCells?: number; okCells?: number; message?: string };
      if (!response.ok) {
        // Only the stale-data conflict can be overridden; other errors stay blocked.
        setCanForce(body.error === "PRINT_DATA_CHANGED");
        throw new Error(body.message ?? "Không thể tô màu. Vui lòng thử lại.");
      }
      setAwaitingConfirmation(false); setCanForce(false);
      setMessage(`Đã tô màu các dòng của kiện ${selection.packageId} và ghi OK vào ${body.okCells ?? 0} ô cột Kiện kho (BO).`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể kết nối máy chủ.");
    } finally { saving.current = false; setBusy(false); }
  };

  return <div className="space-y-2">
    {awaitingConfirmation ? <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm">Nếu giấy đã in xong, xác nhận để tô màu cột Lô trong Google Sheets cho kiện {selection.packageId}, lô {selection.lot}.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={!enabled || busy} onClick={() => void mark()}>{busy ? "Đang tô màu…" : "Đã in xong – tô cột Lô"}</Button>
        {canForce ? <Button type="button" variant="destructive" disabled={!enabled || busy} onClick={() => void mark(true)}>Tô đè – kiện này</Button> : null}
        <Button type="button" variant="outline" disabled={busy} onClick={() => { setAwaitingConfirmation(false); setError(""); }}>Đã hủy / Chưa in</Button>
      </div>
    </div> : null}
    {message ? <p className="text-sm text-primary" role="status">{message}</p> : null}
    {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
  </div>;
}
