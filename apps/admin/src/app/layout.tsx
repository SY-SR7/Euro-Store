import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from './components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EuroStore Admin',
  description: 'EuroStore Admin Panel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.className} bg-[#0F1117] text-white min-h-screen flex`}>
        {/* We will render the sidebar conditionally or assume it's part of the dashboard layout.
            Wait, if the login page is shown, we shouldn't show the sidebar. 
            So Sidebar should only be shown inside (dashboard) layout. Let me update this.
         */}
        {children}
      </body>
    </html>
  );
}
