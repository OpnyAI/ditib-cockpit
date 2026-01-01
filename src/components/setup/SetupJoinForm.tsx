"use client";

import * as React from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DirectoryRow = {
  id: string;
  name: string;
  city: string | null;
  postal_code: string | null;
};

export default function SetupJoinForm() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const [displayName, setDisplayName] = React.useState("");
  const [directoryId, setDirectoryId] = React.useState<string>("");

  const [items, setItems] = React.useState<DirectoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadDirectory() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("ditib_directory")
        .select("id,name,city,postal_code")
        .order("name", { ascending: true })
        .limit(1000);

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setItems([]);
      } else {
        setItems((data ?? []) as DirectoryRow[]);
      }

      setLoading(false);
    }

    loadDirectory();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const canSubmit =
    displayName.trim().length > 1 && !!directoryId && !loading && !submitting;

  async function submitRequest() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/setup/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          directory_id: directoryId,
        }),
      });

      const json = await res.json().catch(() => ({} as unknown));

      if (!res.ok) {
        setError(json?.error ?? "Unbekannter Fehler beim Senden der Anfrage.");
        return;
      }

      if (json?.alreadyExists) {
        setSuccess("Deine Anfrage existiert bereits ✅ (warte auf Freigabe).");
      } else {
        setSuccess(
          "Anfrage gesendet ✅ Du wirst nach Freigabe benachrichtigt."
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler beim Senden der Anfrage.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ditib-card w-full rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-14">
          <Image
            src="/brand/ditib-logo.png"
            alt="DITIB"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div>
          <h1 className="text-xl font-semibold leading-tight">
            Zugang anfragen
          </h1>
          <p className="mt-0.5 text-sm text-white/70">
            Wähle deine Gemeinde aus dem DITIB-Verzeichnis und stelle eine
            Anfrage. Ein ADMIN muss dich freigeben.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block text-sm text-white/80">Dein Name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="z. B. Mehmet Çatalsakal"
            className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/20"
            autoComplete="name"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm text-white/80">
            Gemeinde (DITIB Verzeichnis)
          </label>

          <div className="mt-2">
            <select
              value={directoryId}
              onChange={(e) => setDirectoryId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/20"
              disabled={loading || submitting}
            >
              <option value="">
                {loading ? "Lade Gemeinden..." : "Bitte auswählen ..."}
              </option>

              {items.map((g) => {
                const suffixParts = [g.postal_code, g.city].filter(Boolean);
                const suffix = suffixParts.length
                  ? ` — ${suffixParts.join(" ")}`
                  : "";
                return (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {suffix}
                  </option>
                );
              })}
            </select>
          </div>

          {error ? (
            <p className="mt-2 text-sm text-red-300">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-white/50">
              Es werden bis zu 1000 Einträge geladen (alphabetisch).
            </p>
          )}

          {success ? (
            <p className="mt-2 text-sm text-emerald-300">{success}</p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          className="ditib-btn inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          onClick={submitRequest}
        >
          {submitting ? "Sende..." : "Anfrage senden"}
        </button>

        <div className="text-xs text-white/50">
          Hinweis: Nach dem Absenden muss ein ADMIN dich freigeben.
        </div>
      </div>
    </div>
  );
}
