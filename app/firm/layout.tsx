import { AppShell } from "@/components/project-shell/AppShell";

export default function FirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
