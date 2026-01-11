"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type JoinRequestRow = {
  id: string;
  user_id: string;
  tenant_id: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  created_at: string;
  decided_at: string | null;
  display_name: string | null;
  directory_id: string | null;
};

const ROLE_OPTIONS = [
  { value: "MITARBEITER", label: "Mitarbeiter" },
  { value: "VORSTAND", label: "Vorstand" },
  { value: "KASSIERER", label: "Kassierer" },
] as const;

function statusBadgeClass(status: string) {
  if (status === "PENDING") return "bg-amber-500/15 text-amber-200";
  if (status === "APPROVED") return "bg-emerald-500/15 text-emerald-200";
  if (status === "REJECTED") return "bg-rose-500/15 text-rose-200";
  return "bg-zinc-500/15 text-zinc-200";
}

export default function AdminJoinRequestsClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<JoinRequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // UX: default nur offene Requests anzeigen
  const [showDecided, setShowDecided] = useState(false);

  // per-request UI state (role + board flag)
  const [roleById, setRoleById] = useState<Record<string, string>>({});
  const [boardById, setBoardById] = useState<Record<string, boolean>>({});
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});

  async function load() {
    setError(null);
    setLoading(true);

    let query = supabase
      .from("tenant_join_requests")
      .select(
        "id,user_id,tenant_id,status,created_at,decided_at,display_name,directory_id"
      )
      .order("created_at", { ascending: false });

    if (!showDecided) {
      query = query.eq("status", "PENDING");
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const list = (data ?? []) as JoinRequestRow[];
    setRows(list);

    // defaults for controls
    const nextRole: Record<string, string> = {};
    const nextBoard: Record<string, boolean> = {};

    for (const r of list) {
      // Defaultrolle für neue Requests
      nextRole[r.id] = roleById[r.id] ?? "MITARBEITER";
      nextBoard[r.id] = boardById[r.id] ?? false;
    }

    setRoleById((prev) => ({ ...prev, ...nextRole }));
    setBoardById((prev) => ({ ...prev, ...nextBoard }));

    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDecided]);

  async function decide(requestId: string, action: "approve" | "reject") {
    setError(null);
    setBusyById((p) => ({ ...p, [requestId]: true }));

    const role = roleById[requestId] ?? "MITARBEITER";
    const isBoardMember = !!boardById[requestId];

    const res = await fetch("/api/admin/join-requests/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        action,
        role,
        isBoardMember,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      setError(txt || `Request failed (${res.status})`);
      setBusyById((p) => ({ ...p, [requestId]: false }));
      return;
    }

    setBusyById((p) => ({ ...p, [requestId]: false }));
    await load();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Zugangs-Anfragen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Freigaben für deine Gemeinde.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex h-10 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={showDecided}
              onChange={(e) => setShowDecided(e.target.checked)}
            />
            <span>Auch erledigte anzeigen</span>
          </label>

          <button
            type="button"
            onClick={() => void load()}
            className="h-10 rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-medium hover:bg-white/15 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "…" : "Reload"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* Content */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Lade Anfragen…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {showDecided
            ? "Keine Anfragen vorhanden."
            : "Keine offenen Anfragen."}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const isPending = r.status === "PENDING";
            const busy = !!busyById[r.id];

            return (
              <div
                key={r.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-medium">
                        {r.display_name ?? "Unbekannt"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({r.user_id.slice(0, 8)}…)
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      Status:{" "}
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          statusBadgeClass(r.status),
                        ].join(" ")}
                      >
                        {r.status}
                      </span>
                      <span className="mx-2 text-white/20">•</span>
                      Erstellt: {new Date(r.created_at).toLocaleString()}
                      {r.decided_at ? (
                        <>
                          <span className="mx-2 text-white/20">•</span>
                          Entscheiden: {new Date(r.decided_at).toLocaleString()}
                        </>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <div className="mb-1 text-xs text-muted-foreground">
                          Rolle nach Freigabe
                        </div>
                        <select
                          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-white/20 disabled:opacity-60"
                          value={roleById[r.id] ?? "MITARBEITER"}
                          onChange={(e) =>
                            setRoleById((p) => ({
                              ...p,
                              [r.id]: e.target.value,
                            }))
                          }
                          disabled={!isPending || busy}
                        >
                          {ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex h-10 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-sm disabled:opacity-60">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={!!boardById[r.id]}
                          onChange={(e) =>
                            setBoardById((p) => ({
                              ...p,
                              [r.id]: e.target.checked,
                            }))
                          }
                          disabled={!isPending || busy}
                        />
                        <span>Als Vorstandsmitglied markieren</span>
                      </label>
                    </div>

                    {!isPending ? (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Hinweis: Anfrage ist bereits entschieden. Rollenwahl ist
                        nur bei <span className="font-medium">PENDING</span>{" "}
                        aktiv.
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      className="h-10 rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-medium hover:bg-white/15 disabled:opacity-50"
                      onClick={() => decide(r.id, "approve")}
                      disabled={!isPending || busy}
                    >
                      {busy ? "…" : "Freigeben"}
                    </button>
                    <button
                      className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
                      onClick={() => decide(r.id, "reject")}
                      disabled={!isPending || busy}
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
