/* eslint-disable */
// @ts-nocheck
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

import { VisualSymbolInjector } from '@/components/common/VisualSymbolInjector';
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FAFAF8] text-[#1C1917]">
        <VisualSymbolInjector />
      {children}
      </main>
      <Footer />
    </>
  );
}