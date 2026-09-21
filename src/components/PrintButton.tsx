"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button className="w-full shrink-0 sm:w-auto" type="button" size="lg" onClick={() => window.print()}>
      <Printer />
      <span className="sm:hidden">In phiếu</span>
      <span className="hidden sm:inline">In / Ctrl+P</span>
    </Button>
  );
}
