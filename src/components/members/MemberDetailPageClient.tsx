"use client";

import * as React from "react";
import { FeesTab } from "@/components/members/FeesTab";

type Member = {
  id: string;
  full_name: string;
  function_title: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type TabKey = "stammdaten" | "historie" | "beitraege";

function formatDate(value: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("de-DE");
}

export default function MemberDetailPageClient({
  memberId,
  canWriteFees,
}: {
  memberId: string;
  canWriteFees: boolean;
}) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("stammdaten");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [member, setMember] = React.useState<Member | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/members/${memberId}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          if (!cancelled) {
            setError(typeof json?.error === "string" ? json.error : `Fehler (${res.status})`);
            setMember(null);
          }
          return;
        }
        if (!cancelled) {
          setMember((json?.member ?? null) as Member | null);
        }
      } catch {
        if (!cancelled) {
          setError("Mitglied konnte nicht geladen werden.");
          setMember(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return (
    <div className="space-y-4">
      <div className="ui-card p-4 md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">{member?.full_name ?? "Mitglied"}</h1>
            <p className="text-sm ui-muted">{member?.function_title ?? "Keine Funktion hinterlegt"}</p>
          </div>
          <span
            className={[
              "inline-flex rounded-full border px-2 py-0.5 text-xs",
              member?.is_active
                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                : "border-[rgb(var(--border))] ui-muted",
            ].join(" ")}
          >
            {member?.is_active ? "Aktiv" : "Inaktiv"}
          </span>
        </div>
      </div>

      <div className="ui-card p-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("stammdaten")}
            className={[
              "ui-btn h-10 px-3 text-sm",
              activeTab === "stammdaten" ? "ui-btn-primary" : "",
            ].join(" ")}
          >
            Stammdaten
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("historie")}
            className={[
              "ui-btn h-10 px-3 text-sm",
              activeTab === "historie" ? "ui-btn-primary" : "",
            ].join(" ")}
          >
            Historie
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("beitraege")}
            className={[
              "ui-btn h-10 px-3 text-sm",
              activeTab === "beitraege" ? "ui-btn-primary" : "",
            ].join(" ")}
          >
            Beiträge
          </button>
        </div>
      </div>

      {loading ? <div className="ui-card p-5 text-sm ui-muted">Lade Mitglied…</div> : null}
      {error ? (
        <div className="ui-card p-5 text-sm text-red-700 dark:text-red-300">{error}</div>
      ) : null}

      {!loading && !error && member && activeTab === "stammdaten" ? (
        <div className="ui-card p-4 md:p-5">
          <h2 className="text-base font-semibold">Stammdaten</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="ui-muted">E-Mail</dt>
              <dd>{member.email ?? "-"}</dd>
            </div>
            <div>
              <dt className="ui-muted">Telefon</dt>
              <dd>{member.phone ?? "-"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="ui-muted">Notizen</dt>
              <dd>{member.notes ?? "-"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {!loading && !error && member && activeTab === "historie" ? (
        <div className="ui-card p-4 md:p-5">
          <h2 className="text-base font-semibold">Historie</h2>
          <div className="mt-3 space-y-1 text-sm ui-muted">
            <p>Erstellt: {formatDate(member.created_at)}</p>
            <p>Zuletzt aktualisiert: {formatDate(member.updated_at)}</p>
          </div>
        </div>
      ) : null}

      {!loading && !error && member && activeTab === "beitraege" ? (
        <FeesTab memberId={member.id} canWrite={canWriteFees} />
      ) : null}
    </div>
  );
}
