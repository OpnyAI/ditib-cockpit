import { redirect } from "next/navigation";
import Link from "next/link";
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

function QuickCard({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "ui-card",
        "group",
        "px-4 py-4 md:px-5 md:py-5",
        "transition",
        "hover:opacity-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]",
      ].join(" ")}
    >
      <div className="flex min-h-[76px] items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-5">{title}</div>
          <div className="mt-1 text-sm ui-muted leading-5">{subtitle}</div>
        </div>

        <div className="shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/50 transition group-hover:bg-[rgb(var(--surface-2))]/80">
            <span className="text-xl ui-muted leading-none" aria-hidden>
              ›
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyActivityCard({ canSeeActivity }: { canSeeActivity: boolean }) {
  if (!canSeeActivity) {
    return (
      <div className="mt-3 text-sm ui-muted">
        Activity Log ist ein internes Feature und nur für Vorstand/ADMIN
        sichtbar.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/55 p-4 md:p-5">
      <div className="text-sm font-semibold leading-5">
        Noch keine Aktivitäten vorhanden
      </div>
      <p className="mt-1 text-sm ui-muted leading-5">
        Sobald Nutzer Aktionen ausführen (z. B. Join Requests, Freigaben,
        Setups), erscheinen sie hier automatisch.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link className="ui-btn ui-btn-primary px-4" href="/app/admin/requests">
          Anfragen ansehen
        </Link>
        <Link className="ui-btn px-4" href="/app/settings">
          Einstellungen prüfen
        </Link>
      </div>
    </div>
  );
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
      .limit(10);

    activity = (data ?? []) as ActivityRow[];
  }

  /**
   * WICHTIG:
   * - Wir zentrieren den Content-Block (Apple-like),
   * - und schalten 2 Spalten bereits ab md (weil die Sidebar die Breite frisst).
   */
  return (
    <div className="w-full">
      {/* Centered content block */}
      <div className="mx-auto w-full max-w-[1240px]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
          {/* LEFT */}
          <div className="md:col-span-7 xl:col-span-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm ui-muted">
                Überblick über die wichtigsten Bereiche deiner Gemeinde.
              </p>
            </div>

            {/* Quick actions */}
            <section className="ui-card p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Bereiche</div>
                <div className="text-xs ui-muted">Schnellzugriff</div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                <QuickCard
                  href="/app/finance"
                  title="Finanzen"
                  subtitle="Einnahmen & Ausgaben"
                />
                <QuickCard
                  href="/app/communication"
                  title="Mitteilungen"
                  subtitle="Ankündigungen & Infos"
                />
                <QuickCard
                  href="/app/events"
                  title="Termine"
                  subtitle="Gebetszeiten & Events"
                />
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="md:col-span-5 xl:col-span-4">
            <section className="ui-card p-4 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Letzte Aktivitäten</h2>
                {!canSeeActivity ? (
                  <span className="text-xs ui-muted">Nur Vorstand</span>
                ) : null}
              </div>

              {!canSeeActivity || activity.length === 0 ? (
                <EmptyActivityCard canSeeActivity={canSeeActivity} />
              ) : (
                <div className="mt-4 space-y-2">
                  {activity.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/55 px-3 py-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-sm leading-5">
                          {formatAction(a)}
                        </div>
                        <div className="text-xs ui-muted">
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
        </div>
      </div>
    </div>
  );
}
