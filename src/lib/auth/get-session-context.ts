import type { Profile, Tenant, Role } from "@/lib/auth/types";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";

export type SessionContext = {
  userId: string;
  profile: Profile | null;
  tenant: Tenant | null;
  role: Role | null;
  needsSetup: boolean;
  needsApproval: boolean;
  approvalStatus: "NONE" | "PENDING" | "REJECTED";
};

export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createSupabaseServerReadClient();

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id ?? "";

  if (!userId) {
    return {
      userId: "",
      profile: null,
      tenant: null,
      role: null,
      needsSetup: false,
      needsApproval: false,
      approvalStatus: "NONE",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "user_id, tenant_id, role, display_name, is_board_member, created_at"
    )
    .eq("user_id", userId)
    .maybeSingle<Profile>();

  if (!profile) {
    return {
      userId,
      profile: null,
      tenant: null,
      role: null,
      needsSetup: true,
      needsApproval: false,
      approvalStatus: "NONE",
    };
  }

  // Wenn tenant_id fehlt → prüfen, ob ein Join Request existiert
  if (!profile.tenant_id) {
    const { data: req } = await supabase
      .from("tenant_join_requests")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ status: "PENDING" | "APPROVED" | "REJECTED" }>();

    if (req?.status === "PENDING") {
      return {
        userId,
        profile,
        tenant: null,
        role: profile.role ?? null,
        needsSetup: false,
        needsApproval: true,
        approvalStatus: "PENDING",
      };
    }

    if (req?.status === "REJECTED") {
      return {
        userId,
        profile,
        tenant: null,
        role: profile.role ?? null,
        needsSetup: true,
        needsApproval: true,
        approvalStatus: "REJECTED",
      };
    }

    return {
      userId,
      profile,
      tenant: null,
      role: profile.role ?? null,
      needsSetup: true,
      needsApproval: false,
      approvalStatus: "NONE",
    };
  }

  // tenant exists → tenant laden
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, logo_url, directory_id, created_at")
    .eq("id", profile.tenant_id)
    .maybeSingle<Tenant>();

  return {
    userId,
    profile,
    tenant: tenant ?? null,
    role: profile.role,
    needsSetup: false,
    needsApproval: false,
    approvalStatus: "NONE",
  };
}
