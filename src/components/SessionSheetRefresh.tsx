"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readLookupPreference } from "@/lib/lookup-preference";

const PERIOD = 15 * 60 * 1000;
type RefreshState = { busy: boolean; version: number; fileId?: string; sheetId?: number; error?: string };
const Context = createContext<RefreshState>({ busy: false, version: 0 });
export const useSessionSheetRefresh = () => useContext(Context);

export function SessionSheetRefresh({ createdAt, expiresAt, children }: { createdAt: number; expiresAt: number; children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<RefreshState>({ busy: false, version: 0 });
  useEffect(() => {
    let stopped = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const storageKey = `phan-don:refresh-slot:${createdAt}`;
    let slot = 0;
    try { slot = Number(sessionStorage.getItem(storageKey)) || 0; } catch { /* Storage disabled. */ }
    const tick = async () => {
      if (stopped || running) return;
      clearTimeout(timer);
      if (Date.now() >= expiresAt) { stopped = true; router.replace("/login"); router.refresh(); return; }
      const currentSlot = Math.floor((Date.now() - createdAt) / PERIOD);
      if (currentSlot > slot) {
        slot = currentSlot;
        try { sessionStorage.setItem(storageKey, String(slot)); } catch { /* Storage disabled. */ }
        const selected = readLookupPreference(localStorage);
        if (selected?.sheetId !== undefined) {
          running = true;
          setState((old) => ({ ...selected, busy: true, version: old.version }));
          try {
            const response = await fetch("/api/refresh?scope=sheet", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(selected), signal: controller.signal,
            });
            if (response.status === 401) { stopped = true; router.replace("/login"); router.refresh(); return; }
            if (!response.ok) throw new Error("Không thể tự cập nhật sheet. Hãy bấm Làm mới hoặc quay lại tra cứu trước khi in.");
            if (!stopped) setState((old) => ({ ...selected, busy: false, version: old.version + 1 }));
          } catch (error) {
            if (!stopped) setState((old) => ({ ...selected, busy: false, version: old.version, error: error instanceof Error ? error.message : "Không thể cập nhật sheet." }));
          } finally { running = false; }
        }
      }
      if (!stopped) timer = setTimeout(() => void tick(), Math.max(1000, Math.min(createdAt + (slot + 1) * PERIOD, expiresAt) - Date.now()));
    };
    const wake = () => { void tick(); };
    timer = setTimeout(wake, 0);
    window.addEventListener("focus", wake);
    document.addEventListener("visibilitychange", wake);
    return () => { stopped = true; clearTimeout(timer); controller.abort(); window.removeEventListener("focus", wake); document.removeEventListener("visibilitychange", wake); };
  }, [createdAt, expiresAt, router]);
  return <Context.Provider value={state}>
    {state.busy || state.error ? <div className="noPrint border-b bg-background p-3 text-sm" role="status">{state.busy ? "Đang tự cập nhật sheet theo chu kỳ 15 phút…" : state.error}</div> : null}
    {children}
  </Context.Provider>;
}
