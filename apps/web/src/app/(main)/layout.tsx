/* eslint-disable */
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WishlistProvider } from '@/components/wishlist/WishlistProvider';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { getSessionClient } from '@/supabase-server';
import { CartSync } from '@/components/cart/CartSync';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { client: supabase, user } = await getSessionClient();
  let loyaltyPoints = null;
  if (user) {
    const { data } = await supabase.from('customer_profiles').select('loyalty_points').eq('id', user.id).maybeSingle();
    if (data) loyaltyPoints = data.loyalty_points;
  }

  return (
    <AuthModalProvider isAuthenticated={!!user}>
      <WishlistProvider>
        <CartSync isAuthenticated={!!user} />
        <div className="flex min-h-screen flex-col bg-background text-text-primary">
          <Header loyaltyPoints={loyaltyPoints} />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
        </div>
      </WishlistProvider>
    </AuthModalProvider>
  );
}
