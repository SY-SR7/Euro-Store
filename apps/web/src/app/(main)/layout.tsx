/* eslint-disable */
// @ts-nocheck
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0F0F0F] text-[#E2E2E2]">
        {children}
      </main>
      <Footer />
    </>
  );
}
