import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireUser } from "@/services/auth-service";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser();
  return <DashboardShell>{children}</DashboardShell>;
}
