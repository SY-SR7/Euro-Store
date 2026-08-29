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
    <div className="flex h-screen bg-[#0F0F0F]">
      <PartnerSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
