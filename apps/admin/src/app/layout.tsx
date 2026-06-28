import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EuroStore Admin",
  description: "EuroStore Admin Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
