import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EuroStore Web",
  description: "EuroStore Customer Storefront",
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
