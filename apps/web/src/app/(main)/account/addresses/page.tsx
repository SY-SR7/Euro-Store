import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createAdminSupabaseClient, getSessionClient } from '@/supabase-server';
import { getLocale } from 'next-intl/server';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AddressesClient } from './AddressesClient';

export const dynamic = 'force-dynamic';

export default async function AddressesPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';
  
  const { user } = await getSessionClient();
  if (!user) redirect('/auth/login');
  const supabase = createAdminSupabaseClient();

  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', user.id)
    .order('is_default', { ascending: false });

  return (
    <main className="min-h-screen bg-background px-4 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-lg space-y-5">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/account" className="hover:text-primary transition-colors">
            {isAr ? 'حسابي' : 'My Account'}
          </Link>
          {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-text-primary font-semibold">{isAr ? 'عناويني' : 'My Addresses'}</span>
        </div>

        <AddressesClient initialAddresses={addresses || []} isAr={isAr} />
      </div>
    </main>
  );
}
