import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/get-session-context";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();

  if (!ctx.userId) redirect("/login");
  if (ctx.needsSetup) redirect("/setup");
  if (!ctx.profile || !ctx.tenant || !ctx.role) redirect("/setup");

  return (
    <AppShell tenant={ctx.tenant} profile={ctx.profile}>
      {children}
    </AppShell>
  );
}
