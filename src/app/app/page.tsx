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

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 45) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  if (hr < 24) return `vor ${hr} Std.`;
  if (day < 7) return `vor ${day} Tagen`;

  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

function StatPill({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const base =
    "ui-card group px-4 py-3 md:px-5 md:py-4 transition hover:opacity-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]";
  const inner = (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="ui-small ui-muted">{label}</div>
        <div className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[rgb(var(--fg))]">
          {value}
        </div>
      </div>
      <div className="shrink-0 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/50 px-2.5 py-1 text-xs ui-muted">
        Details
      </div>
    </div>
  );

  if (!href) return <div className={base}>{inner}</div>;

  return (
    <Link href={href} className={base}>
      {inner}
    </Link>
  );
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
        "hover:opacity-[0.985]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]",
      ].join(" ")}
    >
      <div className="flex min-h-[84px] items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="ui-label">{title}</div>
          <div className="mt-1 ui-body ui-muted">{subtitle}</div>
        </div>

        <div className="shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/50 transition group-hover:bg-[rgb(var(--surface-2))]/80">
            <span className="text-xl ui-muted leading-none" aria-hidden>
              ›
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 h-px w-full bg-[rgb(var(--border))]/60" />

      <div className="mt-3 flex items-center justify-between">
        <div className="ui-small ui-muted">Öffnen</div>
        <div className="ui-small ui-muted transition group-hover:text-[rgb(var(--fg))]">
          Anzeigen
        </div>
      </div>
    </Link>
  );
}

function EmptyActivityCard({ canSeeActivity }: { canSeeActivity: boolean }) {
  if (!canSeeActivity) {
    return (
      <div className="mt-3 ui-body ui-muted">
        Activity Log ist ein internes Feature und nur für Vorstand/ADMIN
        sichtbar.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/55 p-4 md:p-5">
      <div className="ui-label">Noch keine Aktivitäten vorhanden</div>
      <p className="mt-1 ui-body ui-muted">
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

function ActivityItem({ a }: { a: ActivityRow }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/55 px-3 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-8 w-8 shrink-0 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/50" />
        <div className="min-w-0 flex-1">
          <div className="ui-body">{formatAction(a)}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 ui-small ui-muted">
            <span className="tabular-nums">
              {formatRelativeTime(a.created_at)}
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {new Date(a.created_at).toLocaleString("de-DE")}
            </span>
            {a.actor_name ? (
              <>
                <span aria-hidden>·</span>
                <span>{a.actor_name}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="shrink-0">
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/50 px-2 py-1 ui-small ui-muted">
            {a.entity_type}
          </div>
        </div>
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

  const lastActivity = activity[0];
  const roleLabel =
    ctx.profile.role === "ADMIN"
      ? "ADMIN"
      : ctx.profile.is_board_member
      ? "VORSTAND"
      : "MITARBEITER";

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
          {/* LEFT */}
          <div className="space-y-6 md:col-span-7 xl:col-span-8">
            <div className="flex flex-col gap-2">
              <h1 className="ui-title">Dashboard</h1>
              <p className="ui-body ui-muted">
                Überblick über die wichtigsten Bereiche deiner Gemeinde.
              </p>

              {/* Subheader row (adds hierarchy + reduces empty feel) */}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/55 px-3 py-1 ui-small ui-muted">
                    Gemeinde:{" "}
                    <span className="text-[rgb(var(--fg))]">
                      {ctx.tenant.name}
                    </span>
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/55 px-3 py-1 ui-small ui-muted">
                    Rolle:{" "}
                    <span className="text-[rgb(var(--fg))]">{roleLabel}</span>
                  </span>
                </div>

                <div className="ui-small ui-muted">
                  {new Date().toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Quick stats row (UI-only, no extra queries) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatPill
                label="Letzte Aktivität"
                value={
                  lastActivity
                    ? formatRelativeTime(lastActivity.created_at)
                    : "—"
                }
                href={canSeeActivity ? undefined : undefined}
              />
              <StatPill
                label="Aktivitäten (sichtbar)"
                value={canSeeActivity ? String(activity.length) : "—"}
              />
              <StatPill label="Module" value="3 aktiv" />
            </div>

            <section className="ui-card p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="ui-h2">Bereiche</div>
                <div className="ui-small ui-muted">Schnellzugriff</div>
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

              {/* Subtle helper row */}
              <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="ui-small ui-muted">
                  Tipp: Nutze „Schnellzugriff“, um wichtige Bereiche ohne Umwege
                  zu öffnen.
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="ui-btn px-4" href="/app/settings">
                    Einstellungen
                  </Link>
                  <Link
                    className="ui-btn ui-btn-primary px-4"
                    href="/app/finance"
                  >
                    Finanzen öffnen
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="md:col-span-5 xl:col-span-4">
            <section className="ui-card p-4 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="ui-h2">Letzte Aktivitäten</h2>
                {!canSeeActivity ? (
                  <span className="ui-small ui-muted">Nur Vorstand</span>
                ) : (
                  <span className="ui-small ui-muted">Live</span>
                )}
              </div>

              {!canSeeActivity || activity.length === 0 ? (
                <EmptyActivityCard canSeeActivity={canSeeActivity} />
              ) : (
                <>
                  <div className="mt-3 ui-small ui-muted">
                    Letzte 10 Einträge · automatisch protokolliert
                  </div>

                  <div className="mt-4 space-y-2">
                    {activity.map((a) => (
                      <ActivityItem key={a.id} a={a} />
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="ui-small ui-muted">
                      Aktualisiert:{" "}
                      <span className="tabular-nums">
                        {new Date().toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <Link className="ui-btn px-4" href="/app/admin/requests">
                      Admin
                    </Link>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
