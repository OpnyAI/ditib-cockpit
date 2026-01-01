// src/app/api/auth/signout/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";

export async function POST() {
  const supabase = await createSupabaseServerMutableClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
