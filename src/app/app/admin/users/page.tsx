// src/app/app/admin/users/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  user_id: string;
  tenant_id: string | null;
  role: "ADMIN" | "VORSTAND" | "KASSIERER" | "MITARBEITER";
  display_name: string | null;
  is_board_member: boolean | null;
  created_at: string;
};

const ROLE_OPTIONS: Array<{ value: ProfileRow["role"]; label: string }> = [
  { value: "MITARBEITER", label: "Mitarbeiter" },
  { value: "KASSIERER", label: "Kassierer" },
  { value: "VORSTAND", label: "Vorstand" },
  { value: "ADMIN", label: "Admin" },
];

export default async function AdminUsersPage() {
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

  const { data: users, error } = await supabase
    .from("profiles")
    .select(
      "user_id, tenant_id, role, display_name, is_board_member, created_at"
    )
    .eq("tenant_id", me.tenant_id)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Benutzerverwaltung</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fehler beim Laden: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Benutzerverwaltung</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rollen und Rechte für deine Gemeinde verwalten.
        </p>
      </div>

      <div className="space-y-3">
        {(users as ProfileRow[] | null)?.map((u) => {
          const isSelf = u.user_id === user.id;

          return (
            <div
              key={u.user_id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-medium">
                      {u.display_name ?? "Unbekannter Nutzer"}
                    </p>
                    {isSelf ? (
                      <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs">
                        Du
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    User ID: <span className="font-mono">{u.user_id}</span>
                  </p>
                </div>

                <form
                  action="/api/admin/users/update"
                  method="post"
                  className="flex flex-col gap-2 md:flex-row md:items-center"
                >
                  <input type="hidden" name="userId" value={u.user_id} />

                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Rolle</span>
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="h-10 w-full min-w-[200px] rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    >
                      {ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm">
                    <input
                      type="checkbox"
                      name="isBoardMember"
                      defaultChecked={!!u.is_board_member}
                      className="h-4 w-4"
                    />
                    Als Vorstandsmitglied markieren
                  </label>

                  <button
                    type="submit"
                    className="h-10 rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-medium transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  >
                    Speichern
                  </button>
                </form>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Hinweis: Rollenänderungen werden serverseitig über Service Role
                durchgeführt (sicher). Nutzer können ihre Rolle nie selbst
                eskalieren.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
