"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  tenant_id: string;
  full_name: string;
  function_title: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

type MemberFormState = {
  full_name: string;
  function_title: string;
  email: string;
  phone: string;
  notes: string;
  is_active: boolean;
};

function toFormState(member?: Member | null): MemberFormState {
  return {
    full_name: member?.full_name ?? "",
    function_title: member?.function_title ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    notes: member?.notes ?? "",
    is_active: member?.is_active ?? true,
  };
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function MembersPageClient({ canManage }: { canManage: boolean }) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);

  const [query, setQuery] = React.useState("");
  const [onlyActive, setOnlyActive] = React.useState(true);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Member | null>(null);
  const [form, setForm] = React.useState<MemberFormState>(toFormState());
  const [saving, setSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const loadMembers = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/members${onlyActive ? "?active=1" : ""}`, {
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          typeof json?.error === "string"
            ? json.error
            : `Mitglieder konnten nicht geladen werden (${res.status}).`
        );
        setMembers([]);
        return;
      }

      setMembers(Array.isArray(json?.members) ? (json.members as Member[]) : []);
    } catch {
      setError("Mitglieder konnten nicht geladen werden.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [onlyActive]);

  React.useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const filteredMembers = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return members;

    return members.filter((m) => {
      const hay = [m.full_name, m.function_title ?? ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [members, query]);

  function openCreateModal() {
    setEditing(null);
    setForm(toFormState());
    setSubmitError(null);
    setModalOpen(true);
  }

  function openEditModal(member: Member) {
    setEditing(member);
    setForm(toFormState(member));
    setSubmitError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setSubmitError(null);
  }

  async function saveMember() {
    setSubmitError(null);

    if (form.full_name.trim().length < 2) {
      setSubmitError("Bitte einen gültigen Namen eingeben (mindestens 2 Zeichen).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        function_title: form.function_title,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
        is_active: form.is_active,
      };

      const endpoint = editing ? `/api/members/${editing.id}` : "/api/members";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setSubmitError(
          typeof json?.error === "string"
            ? json.error
            : `Speichern fehlgeschlagen (${res.status}).`
        );
        return;
      }

      setModalOpen(false);
      setEditing(null);
      setToast(editing ? "Mitglied aktualisiert." : "Mitglied angelegt.");
      router.refresh();
      await loadMembers();
    } finally {
      setSaving(false);
    }
  }

  async function deactivateMember(member: Member) {
    if (!window.confirm(`"${member.full_name}" deaktivieren?`)) return;

    const res = await fetch(`/api/members/${member.id}`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      window.alert(
        typeof json?.error === "string"
          ? json.error
          : `Deaktivieren fehlgeschlagen (${res.status}).`
      );
      return;
    }

    setToast("Mitglied deaktiviert.");
    router.refresh();
    await loadMembers();
  }

  return (
    <div className="space-y-4">
      <div className="ui-card p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Gemeindemitglieder</h1>
            <p className="ui-muted text-sm">Verwaltung der Mitglieder im aktuellen Tenant.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suche nach Name oder Funktion"
              className="ui-input h-11 sm:w-[260px]"
            />
            <label className="ui-btn h-11 cursor-pointer gap-2 px-3 text-sm">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="h-4 w-4"
              />
              Nur aktiv
            </label>
            {canManage ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="ui-btn ui-btn-primary h-11 px-4 text-sm"
              >
                Mitglied hinzufügen
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {toast ? (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {toast}
        </div>
      ) : null}

      {loading ? (
        <div className="ui-card p-6 text-sm ui-muted">Lade Mitglieder…</div>
      ) : error ? (
        <div className="ui-card p-6">
          <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
          <button
            type="button"
            onClick={() => void loadMembers()}
            className="ui-btn mt-3 h-10 px-3 text-sm"
          >
            Erneut versuchen
          </button>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="ui-card p-6 text-sm ui-muted">
          Keine Mitglieder gefunden.
        </div>
      ) : (
        <>
          <div className="ui-card hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))]/70 text-left ui-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Funktion</th>
                  <th className="px-4 py-3 font-medium">Kontakt</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canManage ? <th className="px-4 py-3 font-medium">Aktionen</th> : null}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-[rgb(var(--border))]/40 last:border-0">
                    <td className="px-4 py-3 font-medium">{member.full_name}</td>
                    <td className="px-4 py-3 ui-muted">{member.function_title ?? "-"}</td>
                    <td className="px-4 py-3 ui-muted">
                      <div>{member.email ?? "-"}</div>
                      <div>{member.phone ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex rounded-full border px-2 py-0.5 text-xs",
                          member.is_active
                            ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                            : "border-[rgb(var(--border))] ui-muted",
                        ].join(" ")}
                      >
                        {member.is_active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            className="ui-btn h-9 px-3 text-xs"
                          >
                            Bearbeiten
                          </button>
                          {member.is_active ? (
                            <button
                              type="button"
                              onClick={() => void deactivateMember(member)}
                              className="ui-btn h-9 px-3 text-xs"
                            >
                              Deaktivieren
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredMembers.map((member) => (
              <div key={member.id} className="ui-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{member.full_name}</div>
                    <div className="text-sm ui-muted">{member.function_title ?? "Keine Funktion"}</div>
                  </div>
                  <span
                    className={[
                      "inline-flex rounded-full border px-2 py-0.5 text-xs",
                      member.is_active
                        ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                        : "border-[rgb(var(--border))] ui-muted",
                    ].join(" ")}
                  >
                    {member.is_active ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>

                <div className="mt-2 text-sm ui-muted">
                  {member.email ? <div>{member.email}</div> : null}
                  {member.phone ? <div>{member.phone}</div> : null}
                  {member.notes ? <div className="mt-1">{member.notes}</div> : null}
                </div>

                {canManage ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className="ui-btn h-9 px-3 text-xs"
                    >
                      Bearbeiten
                    </button>
                    {member.is_active ? (
                      <button
                        type="button"
                        onClick={() => void deactivateMember(member)}
                        className="ui-btn h-9 px-3 text-xs"
                      >
                        Deaktivieren
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            onClick={closeModal}
            className="ui-backdrop"
            aria-label="Modal schließen"
          />

          <div className="absolute inset-0 flex items-end justify-center p-0 md:items-center md:p-4">
            <div className="ui-card ui-sheet-in w-full rounded-t-2xl p-4 md:max-w-xl md:rounded-2xl md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editing ? "Mitglied bearbeiten" : "Mitglied hinzufügen"}
                  </h2>
                  <p className="text-sm ui-muted">Pflichtfeld: Name</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="ui-btn h-9 w-9 p-0"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs ui-muted">Name*</label>
                  <input
                    className="ui-input"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    placeholder="Vor- und Nachname"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs ui-muted">Funktion</label>
                  <input
                    className="ui-input"
                    value={form.function_title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, function_title: e.target.value }))
                    }
                    placeholder="z.B. Vorstand"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs ui-muted">E-Mail</label>
                    <input
                      className="ui-input"
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="name@example.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs ui-muted">Telefon</label>
                    <input
                      className="ui-input"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="+49 ..."
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs ui-muted">Notizen</label>
                  <textarea
                    className="ui-input min-h-24 py-2"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Optionale interne Notiz"
                  />
                </div>

                <label className="ui-btn h-11 w-fit cursor-pointer gap-2 px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="h-4 w-4"
                  />
                  Aktiv
                </label>

                {submitError ? (
                  <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                    {submitError}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={closeModal} className="ui-btn h-10 px-3 text-sm">
                  Abbrechen
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveMember()}
                  className="ui-btn ui-btn-primary h-10 px-4 text-sm disabled:opacity-60"
                >
                  {saving ? "Speichert…" : "Speichern"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
