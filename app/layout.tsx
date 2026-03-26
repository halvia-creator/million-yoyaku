import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Narrow 面談予約",
  description: "面談予約システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
