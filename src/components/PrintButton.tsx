"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Printer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Props { targetId?: string; enabled?: boolean }

export function PrintButton({ targetId, enabled = true }: Props) {
  const [checking, setChecking] = useState(Boolean(targetId));
  const [overflow, setOverflow] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!targetId || !enabled) return;
    let cancelled = false;
    const measure = async () => {
      setChecking(true);
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (cancelled) return;
      const target = document.getElementById(targetId);
      if (!target) { setOverflow(true); setChecking(false); return; }
      const table = target.querySelector("table");
      const footer = target.querySelector(".slipFooter");
      const paddingBottom = Number.parseFloat(getComputedStyle(target).paddingBottom) || 0;
      const bounds = target.getBoundingClientRect();
      // Rects include the profile's CSS zoom; clientHeight and padding do not.
      const scale = bounds.height / (Number.parseFloat(getComputedStyle(target).height) || bounds.height);
      const contentBottom = (Math.max(table?.getBoundingClientRect().bottom ?? 0, footer?.getBoundingClientRect().bottom ?? 0) - bounds.top) / scale + paddingBottom;
      const isOverflowing = contentBottom > target.clientHeight + 1;
      target.dataset.printValid = isOverflowing ? "false" : "true";
      setOverflow(isOverflowing);
      setChecking(false);
    };
    void measure();
    const target = document.getElementById(targetId);
    if (target && typeof ResizeObserver !== "undefined") {
      observerRef.current = new ResizeObserver(() => void measure());
      observerRef.current.observe(target);
    }
    return () => { cancelled = true; observerRef.current?.disconnect(); };
  }, [enabled, targetId]);

  const ready = enabled && !checking && !overflow;
  return (
    <div className="space-y-2">
      <Button className="w-full shrink-0 sm:w-auto" type="button" size="lg" disabled={!ready} onClick={() => { if (ready) window.print(); }}>
        {checking ? <Loader2 className="animate-spin" /> : <Printer />}
        <span className="sm:hidden">{checking ? "Đang kiểm tra…" : "In phiếu"}</span>
        <span className="hidden sm:inline">{checking ? "Đang kiểm tra bố cục…" : "In / Ctrl+P"}</span>
      </Button>
      {overflow ? <Alert variant="destructive" className="max-w-lg"><AlertTriangle /><AlertDescription>Nội dung vượt quá một trang phiếu. Hãy điều chỉnh dữ liệu trước khi in; đổi khổ giấy chỉ phóng theo tỷ lệ, không tăng số dòng chứa được.</AlertDescription></Alert> : null}
    </div>
  );
}
