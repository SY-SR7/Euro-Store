/* eslint-disable */
// @ts-nocheck
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WishlistProvider } from '@/components/wishlist/WishlistProvider';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { getSessionClient } from '@/supabase-server';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { client: supabase, user } = await getSessionClient();
  let loyaltyPoints = null;
  if (user) {
    const { data } = await supabase.from('customer_profiles').select('loyalty_points').eq('id', user.id).maybeSingle();
    if (data) loyaltyPoints = data.loyalty_points;
  }

  return (
    <WishlistProvider>
      <Header loyaltyPoints={loyaltyPoints} />
      <main className="min-h-screen bg-background text-text-primary pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </WishlistProvider>
  );
}