import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

type LogInput = {
  tenant_id: string;
  actor_user_id?: string | null;
  actor_name?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  visibility?: "INTERNAL" | "ADMIN_ONLY";
  meta?: Record<string, unknown>;
};

export async function writeActivityLog(input: LogInput) {
  const srv = createSupabaseServiceRoleClient();

  const { error } = await srv.from("activity_log").insert({
    tenant_id: input.tenant_id,
    actor_user_id: input.actor_user_id ?? null,
    actor_name: input.actor_name ?? null,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    visibility: input.visibility ?? "INTERNAL",
    meta: input.meta ?? {},
  });

  // Logging darf keinen Business Flow kaputt machen
  if (error) console.error("activity_log insert failed:", error.message);
}
