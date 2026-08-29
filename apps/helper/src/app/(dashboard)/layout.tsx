import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getHelperAccess } from '../../auth';
import { createServerSupabaseClient } from '../../supabase-server';
import { HelperSidebar } from '../components/HelperSidebar';

export default async function HelperDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const access = await getHelperAccess(supabase);
  if (!access) redirect('/login');

  return (
    <div className="flex h-screen bg-[#0F0F0F]">
      <HelperSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
