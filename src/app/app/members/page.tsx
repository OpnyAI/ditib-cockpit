import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MembersPageClient from "@/components/members/MembersPageClient";

export default async function MembersPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_board_member")
    .eq("user_id", user.id)
    .maybeSingle<{ role: string | null; is_board_member: boolean | null }>();

  const canManage =
    me?.role === "ADMIN" ||
    me?.role === "VORSTAND" ||
    Boolean(me?.is_board_member);

  return (
    <div className="space-y-3">
      {process.env.NODE_ENV !== "production" ? (
        <a
          href="/api/debug/supabase"
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-xs ui-link"
        >
          Debug: Supabase Verbindung prüfen
        </a>
      ) : null}
      <MembersPageClient canManage={canManage} />
    </div>
  );
}
