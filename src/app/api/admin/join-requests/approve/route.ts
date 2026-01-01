import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerMutableClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const id = String(form.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: me, error: meErr } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (meErr || !me?.tenant_id || me.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: r, error: rErr } = await supabase
    .from("tenant_join_requests")
    .select("id,user_id,tenant_id,status")
    .eq("id", id)
    .single();

  if (rErr || !r) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (r.tenant_id !== me.tenant_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (r.status !== "PENDING") {
    return NextResponse.redirect(new URL("/app/admin/requests", req.url));
  }

  // 1) Request freigeben
  const { error: upReqErr } = await supabase
    .from("tenant_join_requests")
    .update({ status: "APPROVED", decided_at: new Date().toISOString() })
    .eq("id", r.id);

  if (upReqErr) {
    return NextResponse.json(
      { error: `Update request failed: ${upReqErr.message}` },
      { status: 500 }
    );
  }

  // 2) Membership setzen (profiles = Membership)
  const { error: upProfErr } = await supabase
    .from("profiles")
    .update({ tenant_id: me.tenant_id, role: "MITARBEITER" })
    .eq("user_id", r.user_id);

  if (upProfErr) {
    return NextResponse.json(
      { error: `Update profile failed: ${upProfErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.redirect(new URL("/app/admin/requests", req.url));
}
