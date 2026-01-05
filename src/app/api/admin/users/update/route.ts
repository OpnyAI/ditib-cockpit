// src/app/api/admin/users/update/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_ROLES = new Set([
  "ADMIN",
  "VORSTAND",
  "KASSIERER",
  "MITARBEITER",
]);

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const userId = String(form.get("userId") ?? "");
    const role = String(form.get("role") ?? "MITARBEITER");
    const isBoardMember = form.get("isBoardMember") === "on";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Cookie-auth client
    const supabase = await createSupabaseServerClient();
    const { data: userRes } = await supabase.auth.getUser();
    const me = userRes?.user;

    if (!me) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Load my profile to verify admin
    const { data: meProfile, error: meErr } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("user_id", me.id)
      .maybeSingle();

    if (meErr || !meProfile?.tenant_id || meProfile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Load target user profile to ensure same tenant
    const { data: target, error: targetErr } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (targetErr || !target?.tenant_id) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    if (target.tenant_id !== meProfile.tenant_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Service update
    const svc = getServiceClient();
    const { error: updErr } = await svc
      .from("profiles")
      .update({
        role,
        is_board_member: isBoardMember,
      })
      .eq("user_id", userId);

    if (updErr) {
      return NextResponse.json(
        { error: `Update failed: ${updErr.message}` },
        { status: 500 }
      );
    }

    // Redirect back to page
    return NextResponse.redirect(new URL("/app/admin/users", req.url), 303);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
