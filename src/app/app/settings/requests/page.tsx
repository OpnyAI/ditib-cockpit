import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/get-session-context";
import { RequestsAdmin } from "@/components/settings/RequestsAdmin";

export default async function RequestsPage() {
  const ctx = await getSessionContext();

  if (!ctx.userId) redirect("/login");
  if (!ctx.tenant || !ctx.profile) redirect("/setup");
  if (ctx.profile.role !== "ADMIN") redirect("/app");

  return <RequestsAdmin tenantId={ctx.tenant.id} />;
}
