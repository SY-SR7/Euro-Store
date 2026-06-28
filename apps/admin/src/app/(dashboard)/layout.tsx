import { Sidebar } from '../components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0F0F0F] text-[#E2E2E2]">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
