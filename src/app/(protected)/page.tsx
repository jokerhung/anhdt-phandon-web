import Link from "next/link";
import { PackageSearch, Printer } from "lucide-react";
import { LookupForm } from "@/components/LookupForm";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-svh overflow-x-hidden bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><PackageSearch className="size-5" /></span>
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Phân đơn</p><h1 className="truncate text-lg font-semibold">Tra cứu lô và kiện</h1></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {process.env.NODE_ENV === "development" ? <Button variant="outline" asChild className="min-h-11"><Link href="/print-spike"><Printer /> Thử in</Link></Button> : null}
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <LookupForm />
      </div>
    </main>
  );
}
