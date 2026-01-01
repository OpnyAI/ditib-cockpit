import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/get-session-context";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";

type ActivityRow = {
  id: string;
  action: string;
  entity_type: string;
  actor_name: string | null;
  created_at: string;
  meta: Record<string, unknown>;
};

function formatAction(a: ActivityRow) {
  switch (a.action) {
    case "TENANT_CREATED":
      return "Gemeinde wurde initial eingerichtet";
    case "JOIN_REQUEST_CREATED":
      return "Beitrittsanfrage wurde erstellt";
    case "JOIN_REQUEST_APPROVED":
      return "Beitrittsanfrage wurde freigegeben";
    default:
      return a.action;
  }
}

export default async function DashboardPage() {
  const ctx = await getSessionContext();

  if (!ctx.userId) redirect("/login");
  if (ctx.needsApproval && ctx.approvalStatus === "PENDING")
    redirect("/pending");
  if (ctx.needsSetup) redirect("/setup");
  if (!ctx.tenant || !ctx.profile) redirect("/setup");

  const canSeeActivity =
    ctx.profile.role === "ADMIN" || ctx.profile.is_board_member === true;

  let activity: ActivityRow[] = [];

  if (canSeeActivity) {
    const supabase = await createSupabaseServerReadClient();

    const { data } = await supabase
      .from("activity_log")
      .select("id, action, entity_type, actor_name, created_at, meta")
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: false })
      .limit(8);

    activity = (data ?? []) as ActivityRow[];
  }

  // Hinweis: Dein restliches Dashboard-Layout bleibt wie es ist.
  // Ich render hier nur den Activity-Block als "server-side truth".
  return (
    <div className="space-y-6">
      {/* Hier bleibt dein existierender Header/KPI/Module-Grid – unverändert */}
      {/* ... */}

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/90">
            Letzte Aktivitäten
          </h2>
          {!canSeeActivity ? (
            <span className="text-xs text-white/50">Nur Vorstand</span>
          ) : null}
        </div>

        {!canSeeActivity ? (
          <div className="mt-3 text-sm text-white/60">
            Activity Log ist ein internes Feature und nur für Vorstand/ADMIN
            sichtbar.
          </div>
        ) : activity.length === 0 ? (
          <div className="mt-3 text-sm text-white/60">
            Noch keine Aktivitäten vorhanden.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {activity.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-white/90">{formatAction(a)}</div>
                  <div className="text-xs text-white/60">
                    {a.actor_name ? `${a.actor_name} · ` : ""}
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
