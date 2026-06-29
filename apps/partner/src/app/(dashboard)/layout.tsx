import type { ReactNode } from 'react';
import { PartnerSidebar } from './PartnerSidebar';

export default function PartnerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0F0F0F]">
      <PartnerSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
