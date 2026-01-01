import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-mutable";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const { displayName, directoryId } = body;

  if (!displayName || !directoryId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("tenant_join_requests").insert({
    user_id: user.id,
    directory_id: directoryId,
    display_name: displayName,
    status: "PENDING",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
