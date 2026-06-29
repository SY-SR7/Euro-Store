import { Sidebar } from '../components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1917]" dir="rtl">
      <Sidebar />
      <main className="admin-main min-h-screen w-full px-4 py-6 transition-[padding] duration-300 md:pr-[var(--admin-sidebar-space,17rem)] md:pl-6">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}