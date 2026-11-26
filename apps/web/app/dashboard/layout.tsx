import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-surface min-h-screen">
      <Topbar />
      {/* One framed column, the same one the landing pages draw. */}
      <main className="frame min-h-[calc(100vh-4rem)] pb-20 lg:min-h-[calc(100vh-6.25rem)]">
        {children}
      </main>
    </div>
  );
}
