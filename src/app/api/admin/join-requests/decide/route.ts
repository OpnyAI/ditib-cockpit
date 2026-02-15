import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  requestId: string;
  action: "approve" | "reject";
  role?: string;
  isBoardMember?: boolean;
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");

  return createClient(url, key, { auth: { persistSession: false } });
}

// Wichtig: ADMIN darf NICHT über UI vergeben werden.
const ALLOWED_ASSIGNABLE_ROLES = new Set([
  "VORSTAND",
  "KASSIERER",
  "MITARBEITER",
]);

async function parseBody(req: Request): Promise<Body> {
  const ct = req.headers.get("content-type") || "";

  // JSON (fetch)
  if (ct.includes("application/json")) {
    return (await req.json()) as Body;
  }

  // Form POST (<form action=...>)
  if (
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  ) {
    const fd = await req.formData();
    const requestId = String(fd.get("requestId") || "");
    const action = String(fd.get("action") || "") as Body["action"];
    const role = fd.get("role") ? String(fd.get("role")) : undefined;

    // Checkbox: kommt oft als "on" oder fehlt komplett
    const isBoardMemberRaw = fd.get("isBoardMember");
    const isBoardMember =
      isBoardMemberRaw === "true" ||
      isBoardMemberRaw === "on" ||
      isBoardMemberRaw === "1";

    return { requestId, action, role, isBoardMember };
  }

  // Fallback (damit du sofort siehst, was ankommt)
  throw new Error(`Unsupported content-type: ${ct}`);
}

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);

    if (!body?.requestId || !body?.action) {
      return NextResponse.json(
        { error: "Missing requestId/action" },
        { status: 400 }
      );
    }

    const action = body.action;
    const role = (body.role ?? "MITARBEITER").toUpperCase();
    const isBoardMember = !!body.isBoardMember;

    if (action === "approve" && !ALLOWED_ASSIGNABLE_ROLES.has(role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Allowed: ${Array.from(
            ALLOWED_ASSIGNABLE_ROLES
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // User-auth client (cookies)
    const supabase = await createSupabaseServerClient();
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    const me = userRes?.user;

    if (userErr || !me) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Load request row
    const { data: reqRow, error: reqErr } = await supabase
      .from("tenant_join_requests")
      .select("id,user_id,tenant_id,status,display_name")
      .eq("id", body.requestId)
      .maybeSingle();

    if (reqErr || !reqRow) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (!reqRow.tenant_id) {
      return NextResponse.json(
        { error: "Request missing tenant_id" },
        { status: 400 }
      );
    }

    // Verify admin (must match tenant + ADMIN)
    const { data: meProfile, error: meProfErr } = await supabase
      .from("profiles")
      .select("role,tenant_id")
      .eq("user_id", me.id)
      .maybeSingle();

    if (
      meProfErr ||
      !meProfile ||
      meProfile.role !== "ADMIN" ||
      meProfile.tenant_id !== reqRow.tenant_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Optional: wenn schon entschieden, UI zeigt zwar Dropdown, aber wir blocken serverseitig sauber
    if (reqRow.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request is already decided (status=${reqRow.status}).` },
        { status: 409 }
      );
    }

    // Decide request using user-auth client (RLS Policy sollte das erlauben)
    if (action === "reject") {
      const { error: updErr } = await supabase
        .from("tenant_join_requests")
        .update({ status: "REJECTED", decided_at: new Date().toISOString() })
        .eq("id", reqRow.id);

      if (updErr)
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // APPROVE
    const { error: approveErr } = await supabase
      .from("tenant_join_requests")
      .update({ status: "APPROVED", decided_at: new Date().toISOString() })
      .eq("id", reqRow.id);

    if (approveErr)
      return NextResponse.json({ error: approveErr.message }, { status: 500 });

    // Trigger handle_join_request_approved() wird laufen und ein profiles row upsert mit MITARBEITER machen.
    // Danach setzen wir serverseitig die gewünschte Rolle (ohne RLS via Service Role)
    const svc = getServiceClient();

    const { error: profErr } = await svc
      .from("profiles")
      .update({
        role,
        is_board_member: isBoardMember,
        display_name: reqRow.display_name ?? null,
        tenant_id: reqRow.tenant_id,
      })
      .eq("user_id", reqRow.user_id);

    if (profErr) {
      return NextResponse.json(
        { error: `Update profile failed: ${profErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
