import { Sidebar } from '../components/Sidebar';
import { Navbar }  from '../components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1917]" dir="rtl">
      <Sidebar />
      <div className="flex flex-col md:pr-[var(--admin-sidebar-space,17rem)] transition-[padding-right] duration-300">
        <Navbar />
        <main className="min-h-screen w-full px-4 py-6 md:px-6">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
