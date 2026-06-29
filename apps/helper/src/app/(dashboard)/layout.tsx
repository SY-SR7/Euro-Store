import type { ReactNode } from 'react';
import { HelperSidebar } from '../components/HelperSidebar';

export default function HelperDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0F0F0F]">
      <HelperSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
