/* eslint-disable */
// @ts-nocheck
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WishlistProvider } from '@/components/wishlist/WishlistProvider';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <WishlistProvider>
      <Header />
      <main className="min-h-screen bg-[#FAFAF8] text-[#1C1917] pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </WishlistProvider>
  );
}