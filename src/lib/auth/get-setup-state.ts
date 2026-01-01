// src/lib/auth/get-setup-state.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SetupState =
  | { kind: "LOGGED_OUT" }
  | { kind: "READY"; tenantId: string }
  | { kind: "PENDING" }
  | { kind: "NEEDS_SETUP" };

export async function getSetupState(): Promise<SetupState> {
  const supabase = await createSupabaseServerClient();

  // WICHTIG: getUser() statt getSession() (deine Warnung im Terminal)
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const user = userRes?.user;

  if (userErr || !user) return { kind: "LOGGED_OUT" };

  // 1) Hat der User bereits ein Profil mit Tenant?
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profileErr && profile?.tenant_id) {
    return { kind: "READY", tenantId: profile.tenant_id as string };
  }

  // 2) Hat der User eine offene Join-Request?
  const { data: reqRow, error: reqErr } = await supabase
    .from("tenant_join_requests")
    .select("id,status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reqErr && reqRow?.status === "PENDING") return { kind: "PENDING" };

  // Sonst: Setup notwendig
  return { kind: "NEEDS_SETUP" };
}
