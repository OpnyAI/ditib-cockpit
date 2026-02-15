import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";

export const runtime = "nodejs";

function getSupabaseOrigin() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!raw) return null;

  try {
    return new URL(raw).origin;
  } catch {
    return raw;
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createSupabaseServerMutableClient();

  const { error } = await supabase
    .from("tenant_members")
    .select("id")
    .limit(1);

  return NextResponse.json(
    {
      supabaseOrigin: getSupabaseOrigin(),
      tenantMembersReachable: !error,
      tenantMembersError: error ? error.message : null,
    },
    { status: 200 }
  );
}
