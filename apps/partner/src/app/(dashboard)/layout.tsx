import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getPartnerAccess } from '../../auth';
import { createServerSupabaseClient } from '../../supabase-server';
import { PartnerSidebar } from './PartnerSidebar';

export default async function PartnerDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const access = await getPartnerAccess(supabase);
  if (!access) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col bg-background md:h-screen md:flex-row">
      <PartnerSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
    </div>
  );
}
