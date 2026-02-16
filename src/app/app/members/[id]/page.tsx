import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MemberDetailPageClient from "@/components/members/MemberDetailPageClient";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle<{ role: string | null }>();

  const canWriteFees = me?.role === "ADMIN" || me?.role === "KASSIERER";

  return <MemberDetailPageClient memberId={id} canWriteFees={canWriteFees} />;
}
