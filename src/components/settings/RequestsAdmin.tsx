"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ReqRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  note: string | null;
};

export function RequestsAdmin({ tenantId }: { tenantId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("tenant_join_requests")
      .select("id, user_id, display_name, status, created_at, note")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg("Requests konnten nicht geladen werden.");
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as ReqRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function approve(requestId: string) {
    setBusyId(requestId);
    setErrorMsg(null);

    const res = await fetch("/api/admin/requests/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: requestId,
        role: "KOMMUNIKATION",
        is_board_member: true,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setErrorMsg(
        json?.error
          ? `Approve fehlgeschlagen: ${json.error}`
          : "Approve fehlgeschlagen."
      );
      setBusyId(null);
      return;
    }

    await load();
    setBusyId(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Beitrittsanfragen</h1>
        <p className="mt-1 text-sm text-white/70">
          Hier siehst du Anfragen für deine Gemeinde. Mit „Approve“ wird der
          Nutzer dem Tenant zugeordnet.
        </p>
      </div>

      {errorMsg ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {errorMsg}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        {loading ? (
          <div className="text-sm text-white/70">Lade…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-white/70">Keine Anfragen.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      {r.display_name ?? "—"}
                    </div>
                    <div className="text-xs text-white/60">
                      Status: {r.status} ·{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                    {r.note ? (
                      <div className="mt-1 text-xs text-white/60">
                        Notiz: {r.note}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(r.id)}
                      disabled={busyId === r.id || r.status !== "PENDING"}
                      className="rounded-xl border border-white/10 bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
                    >
                      {busyId === r.id ? "…" : "Approve"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
        Default beim Approve: Rolle = KOMMUNIKATION, Board = true. (Wir
        erweitern das später um Rollenauswahl.)
      </div>
    </div>
  );
}
