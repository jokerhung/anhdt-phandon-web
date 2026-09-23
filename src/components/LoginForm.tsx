"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearLookupPreference } from "@/lib/lookup-preference";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setErrorStatus(null);
    const form = new FormData(event.currentTarget);

    try {
      if (!String(form.get("username") ?? "").trim() || !form.get("password")) {
        setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
        return;
      }
      const response = await fetch("/api/auth/login", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          next: searchParams.get("next") ?? "/",
        }),
      });
      if (!response.ok) {
        // Proxies may return HTML, not JSON. Never render raw server error bodies.
        const messages: Record<number, string> = {
          400: "Dữ liệu đăng nhập không hợp lệ. Vui lòng tải lại trang và thử lại.",
          401: "Thông tin đăng nhập không đúng.",
          403: "Địa chỉ truy cập chưa được phép hoặc yêu cầu bị chặn. Nhờ quản trị viên kiểm tra APP_ORIGIN, ALLOWED_ORIGINS và cấu hình proxy/tunnel.",
          413: "Dữ liệu đăng nhập quá lớn. Vui lòng kiểm tra lại thông tin đã nhập.",
          429: "Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.",
          500: "Máy chủ gặp lỗi xử lý đăng nhập. Vui lòng liên hệ quản trị viên kiểm tra cấu hình và nhật ký máy chủ.",
          502: "Proxy/tunnel không nhận được phản hồi hợp lệ từ ứng dụng. Vui lòng kiểm tra ứng dụng và cổng kết nối.",
          503: "Dịch vụ đăng nhập tạm thời không khả dụng. Vui lòng thử lại sau.",
          504: "Proxy/tunnel chờ máy chủ quá lâu. Vui lòng thử lại sau.",
        };
        const retryAfter = Number(response.headers.get("Retry-After"));
        const retryHint = response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0
          ? ` Thử lại sau ${Math.ceil(retryAfter)} giây.` : "";
        setErrorStatus(response.status);
        setError(`${messages[response.status] ?? "Không thể đăng nhập. Vui lòng thử lại hoặc liên hệ quản trị viên."}${retryHint}`);
        return;
      }
      const result: unknown = await response.json().catch(() => null);
      if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true
        || !("redirectTo" in result) || typeof result.redirectTo !== "string") {
        setError("Máy chủ trả về phản hồi đăng nhập không hợp lệ. Vui lòng tải lại trang; nếu vẫn lỗi, nhờ quản trị viên kiểm tra proxy/tunnel.");
        return;
      }
      clearLookupPreference(localStorage);
      router.replace(result.redirectTo ?? "/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof DOMException && ["TimeoutError", "AbortError"].includes(cause.name)
        ? "Máy chủ chưa phản hồi sau 15 giây. Vui lòng kiểm tra kết nối và thử lại."
        : "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng hoặc Cloudflare Tunnel rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form method="post" action="/api/auth/login" className="space-y-5" aria-labelledby="login-title" aria-describedby={error ? "login-error" : undefined} aria-busy={submitting} onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} enterKeyHint="next" required maxLength={128} placeholder="Nhập tên đăng nhập" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" enterKeyHint="go" required maxLength={1024} placeholder="Nhập mật khẩu" />
      </div>
      {error ? (
        <Alert id="login-error" variant="destructive" aria-live="assertive" aria-atomic="true">
          <AlertCircle />
          <AlertTitle>Đăng nhập không thành công</AlertTitle>
          <AlertDescription><p>{error}</p>{errorStatus ? <p className="mt-1 text-xs">Mã lỗi: HTTP {errorStatus}</p> : null}</AlertDescription>
        </Alert>
      ) : null}
      <Button className="w-full" size="lg" type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : <LogIn />}
        {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
    </form>
  );
}
