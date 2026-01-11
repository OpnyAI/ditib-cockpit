import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminJoinRequestsClient from "@/components/admin/AdminJoinRequestsClient";

export default async function AdminJoinRequestsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!me?.tenant_id) redirect("/setup");
  if (me.role !== "ADMIN") redirect("/app");

  return <AdminJoinRequestsClient />;
}
