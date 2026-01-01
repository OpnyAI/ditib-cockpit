import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type JoinRequestRow = {
  id: string;
  user_id: string;
  tenant_id: string | null;
  directory_id: string;
  display_name: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  created_at: string;
  decided_at: string | null;
  ditib_directory?: {
    name: string;
    city: string | null;
    postal_code: string | null;
  } | null;
};

export default async function AdminJoinRequestsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single();

  if (!me?.tenant_id) redirect("/setup");
  if (me.role !== "ADMIN") redirect("/app");

  const { data, error } = await supabase
    .from("tenant_join_requests")
    .select(
      "id,user_id,tenant_id,directory_id,display_name,status,note,created_at,decided_at,ditib_directory(name,city,postal_code)"
    )
    .eq("tenant_id", me.tenant_id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as JoinRequestRow[];

  return (
    <div className="mx-auto w-full max-w-5xl p-6 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Zugangs-Anfragen</h1>
        <p className="mt-1 text-sm text-white/60">
          Freigaben für deine Gemeinde.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            Fehler beim Laden: {error.message}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-white/60">
            Keine Anfragen vorhanden.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const g = r.ditib_directory;
              const suffixParts = [g?.postal_code, g?.city].filter(Boolean);
              const suffix = suffixParts.length
                ? ` — ${suffixParts.join(" ")}`
                : "";

              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-base font-medium">
                        {r.display_name ?? "Unbekannt"}{" "}
                        <span className="text-xs text-white/50">
                          ({r.user_id.slice(0, 8)}…)
                        </span>
                      </div>

                      <div className="mt-1 text-sm text-white/70">
                        {g?.name ?? "Gemeinde"}
                        {suffix}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
                        <span>Status:</span>
                        <span
                          className={[
                            "rounded-full px-2 py-1",
                            r.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-200"
                              : r.status === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-200"
                              : "bg-red-500/15 text-red-200",
                          ].join(" ")}
                        >
                          {r.status}
                        </span>
                        <span>•</span>
                        <span>
                          Erstellt: {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <form
                        action="/api/admin/join-requests/approve"
                        method="post"
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          disabled={r.status !== "PENDING"}
                          className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Freigeben
                        </button>
                      </form>

                      <form
                        action="/api/admin/join-requests/reject"
                        method="post"
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          disabled={r.status !== "PENDING"}
                          className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Ablehnen
                        </button>
                      </form>
                    </div>
                  </div>

                  {r.note ? (
                    <div className="mt-3 text-xs text-white/60">
                      Notiz: {r.note}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
