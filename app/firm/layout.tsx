import { AppShell } from "@/components/project-shell/AppShell";
import { getFirmContext } from "@/lib/actions/firm-actions";

export default async function FirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { firm } = await getFirmContext();
  return <AppShell showSidebar={Boolean(firm)}>{children}</AppShell>;
}
