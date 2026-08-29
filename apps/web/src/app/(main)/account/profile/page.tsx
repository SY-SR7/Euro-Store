import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionClient } from '@/supabase-server';
import { getLocale } from 'next-intl/server';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProfileForm } from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfileEditPage() {
  const locale = await getLocale();
  const isAr = locale === 'ar';
  
  const { client: supabase, user } = await getSessionClient();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('full_name,phone,gender')
    .eq('id', user.id)
    .single();

  return (
    <main className="min-h-screen bg-background px-4 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-lg space-y-5">
        <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/account" className="hover:text-primary transition-colors">
            {isAr ? 'حسابي' : 'My Account'}
          </Link>
          {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-text-primary font-semibold">{isAr ? 'تعديل الملف الشخصي' : 'Edit Profile'}</span>
        </div>

        <h1 className="text-2xl font-black text-text-primary">{isAr ? 'تعديل الملف الشخصي' : 'Edit Profile'}</h1>

        <div className="rounded-2xl border border-border bg-background-card p-5 shadow-sm">
          <ProfileForm 
            initialData={{
              full_name: profile?.full_name || '',
              phone: profile?.phone || '',
              gender: profile?.gender || ''
            }} 
            isAr={isAr} 
          />
        </div>
      </div>
    </main>
  );
}
