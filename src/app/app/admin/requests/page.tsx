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
  { value: "ADMIN", label: "Admin" },
] as const;

export default function AdminRequestsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<JoinRequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // per-request UI state (role + board flag)
  const [roleById, setRoleById] = useState<Record<string, string>>({});
  const [boardById, setBoardById] = useState<Record<string, boolean>>({});
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});

  async function load() {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("tenant_join_requests")
      .select(
        "id,user_id,tenant_id,status,created_at,decided_at,display_name,directory_id"
      )
      .order("created_at", { ascending: false });

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
      if (!nextRole[r.id]) nextRole[r.id] = "MITARBEITER";
      if (!nextBoard[r.id]) nextBoard[r.id] = false;
    }
    setRoleById((prev) => ({ ...nextRole, ...prev }));
    setBoardById((prev) => ({ ...nextBoard, ...prev }));

    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Zugangs-Anfragen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Freigaben für deine Gemeinde.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-muted-foreground">Lade Anfragen…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Keine offenen Anfragen.
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
                          r.status === "PENDING"
                            ? "bg-amber-500/15 text-amber-200"
                            : r.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "bg-zinc-500/15 text-zinc-200",
                        ].join(" ")}
                      >
                        {r.status}
                      </span>
                      <span className="mx-2 text-white/20">•</span>
                      Erstellt: {new Date(r.created_at).toLocaleString()}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <div className="mb-1 text-xs text-muted-foreground">
                          Rolle nach Freigabe
                        </div>
                        <select
                          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-white/20"
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

                      <label className="flex h-10 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-sm">
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

                {!isPending ? (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Hinweis: Anfrage ist bereits entschieden. Rollenwahl ist nur
                    bei PENDING aktiv.
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
