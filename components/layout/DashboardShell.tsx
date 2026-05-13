import { Sidebar } from "@/components/layout/Sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">{children}</main>
    </div>
  );
}
