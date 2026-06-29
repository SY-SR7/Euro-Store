/* eslint-disable */
// @ts-nocheck
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FAFAF8] text-[#1C1917]">
{children}
      </main>
      <Footer />
    </>
  );
}