"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          next: searchParams.get("next") ?? "/",
        }),
      });
      const result = (await response.json()) as { message?: string; redirectTo?: string };
      if (!response.ok) {
        setError(result.message ?? "Không thể đăng nhập. Vui lòng thử lại.");
        return;
      }
      router.replace(result.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" aria-labelledby="login-title" aria-busy={submitting} onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} enterKeyHint="next" required maxLength={128} placeholder="Nhập tên đăng nhập" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" enterKeyHint="go" required maxLength={1024} placeholder="Nhập mật khẩu" />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button className="w-full" size="lg" type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : <LogIn />}
        {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
    </form>
  );
}
