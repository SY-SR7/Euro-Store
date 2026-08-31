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
    <div className="flex min-h-screen flex-col bg-background md:h-screen md:flex-row">
      <HelperSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
    </div>
  );
}
