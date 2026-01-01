import type { Profile, Role, Tenant } from "@/lib/auth/types";

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-white/50">{hint}</div> : null}
    </div>
  );
}

function Shortcut({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-white/60">{subtitle}</div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold text-white/90">{title}</h2>;
}

export function Dashboard({
  tenant,
  profile,
  role,
}: {
  tenant: Tenant;
  profile: Profile;
  role: Role;
}) {
  // In Phase 4.1 sind das bewusst “Placeholder-Werte”.
  // In Phase 4.2 hängen wir Activity Log + Module-Kennzahlen dran.
  const roleLabel =
    role === "ADMIN"
      ? "Admin Cockpit"
      : role === "BUCHHALTER"
      ? "Finance Cockpit"
      : "Kommunikation Cockpit";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs text-white/60">Aktive Gemeinde</div>
          <h1 className="text-xl font-semibold">{tenant.name}</h1>
          <div className="mt-1 text-sm text-white/70">
            {roleLabel} · {profile.display_name}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/70">
          Tenant-ID: <span className="text-white/90">{tenant.id}</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {role === "ADMIN" ? (
          <>
            <StatCard
              title="Module aktiv"
              value="3"
              hint="Finanzen · Mitteilungen · Termine"
            />
            <StatCard
              title="Öffentliche Seite"
              value="Online"
              hint={`/g/${tenant.slug}`}
            />
            <StatCard
              title="Letzte Aktivität"
              value="—"
              hint="Activity Log kommt als nächstes"
            />
          </>
        ) : null}

        {role === "BUCHHALTER" ? (
          <>
            <StatCard
              title="Finanzstatus"
              value="—"
              hint="In Phase 4.2: Monatszahlen"
            />
            <StatCard
              title="Offene Aufgaben"
              value="—"
              hint="In Phase 4.2: Quick Actions"
            />
            <StatCard
              title="Letzte Buchung"
              value="—"
              hint="In Phase 4.2: letzte Transaktionen"
            />
          </>
        ) : null}

        {role === "KOMMUNIKATION" ? (
          <>
            <StatCard
              title="Veröffentlichungen"
              value="—"
              hint="In Phase 4.2: Posts/Events live"
            />
            <StatCard
              title="Nächster Termin"
              value="—"
              hint="In Phase 4.2: Events"
            />
            <StatCard
              title="Letzte Aktivität"
              value="—"
              hint="Activity Log kommt als nächstes"
            />
          </>
        ) : null}
      </div>

      <div className="space-y-3">
        <SectionTitle title="Module" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(role === "ADMIN" || role === "BUCHHALTER") && (
            <Shortcut
              title="Finanzen"
              subtitle="Einnahmen, Ausgaben, Kategorien, Auswertungen"
            />
          )}
          {(role === "ADMIN" || role === "KOMMUNIKATION") && (
            <Shortcut
              title="Mitteilungen"
              subtitle="Intern & Öffentlich, Publish-Flow"
            />
          )}
          {(role === "ADMIN" || role === "KOMMUNIKATION") && (
            <Shortcut
              title="Termine"
              subtitle="Verkündungen, intern/öffentlich"
            />
          )}
          {role === "ADMIN" && (
            <Shortcut
              title="Einstellungen"
              subtitle="Gemeinde & Zugriffe verwalten"
            />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle title="Letzte Aktivitäten" />
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          Activity Log wird als nächstes angebunden (Phase 4.2).
        </div>
      </div>
    </div>
  );
}
