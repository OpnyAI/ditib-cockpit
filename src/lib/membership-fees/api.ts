import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";
import type { MembershipFeeRole } from "@/lib/membership-fees/access";
import {
  canReadAllFees,
  canReadMemberFees,
  canWriteFees,
  isDateLike,
  isRecord,
  isUuid,
} from "@/lib/membership-fees/access";

type Profile = {
  tenant_id: string | null;
  role: MembershipFeeRole | null;
};

export type FeeAuthContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerMutableClient>>;
  userId: string;
  userEmail: string | null;
  tenantId: string;
  role: MembershipFeeRole | null;
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data, error: null }, { status });
}

export function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, data: null, error }, { status });
}

export async function getFeeAuthContext(): Promise<FeeAuthContext | NextResponse> {
  const supabase = await createSupabaseServerMutableClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return fail("UNAUTHENTICATED", 401);
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .maybeSingle<Profile>();

  if (profileErr || !profile?.tenant_id) {
    return fail("TENANT_CONTEXT_NOT_FOUND", 403);
  }

  return {
    supabase,
    userId: user.id,
    userEmail: user.email ?? null,
    tenantId: profile.tenant_id,
    role: profile.role,
  };
}

export async function getTenantMember(
  ctx: FeeAuthContext,
  memberId: string,
) {
  const { data: member, error } = await ctx.supabase
    .from("tenant_members")
    .select("id, tenant_id, email, full_name")
    .eq("id", memberId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle<{ id: string; tenant_id: string; email: string | null; full_name: string }>();

  if (error) {
    return { error: fail(`MEMBER_LOOKUP_FAILED: ${error.message}`, 500) };
  }

  if (!member) {
    return { error: fail("MEMBER_NOT_FOUND", 404) };
  }

  return { member };
}

export { canReadAllFees, canReadMemberFees, canWriteFees, isDateLike, isRecord, isUuid };
