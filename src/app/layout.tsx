import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phân đơn",
  description: "Tra cứu và in phiếu phân đơn",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
