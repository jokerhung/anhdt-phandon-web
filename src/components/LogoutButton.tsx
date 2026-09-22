"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearLookupPreference } from "@/lib/lookup-preference";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearLookupPreference(localStorage);
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Button type="button" variant="outline" onClick={logout} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <LogOut />}
      {busy ? "Đang đăng xuất…" : "Đăng xuất"}
    </Button>
  );
}
