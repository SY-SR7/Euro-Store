import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EuroStore Helper",
  description: "EuroStore Helper Portal",
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
