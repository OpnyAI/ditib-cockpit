"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type JoinableDirectoryRow = {
  id: string;
  name: string;
  city: string | null;
  postal_code: string | null;
};

export default function SetupJoinForm() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [displayName, setDisplayName] = React.useState("");
  const [directoryId, setDirectoryId] = React.useState<string>("");

  const [items, setItems] = React.useState<JoinableDirectoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadJoinableDirectory() {
      setLoading(true);
      setError(null);

      // ✅ Lädt NUR aktivierte Gemeinden (Tenant existiert) aus der View
      const { data, error } = await supabase
        .from("joinable_directory")
        .select("id,name,city,postal_code")
        .order("name", { ascending: true });

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setItems([]);
      } else {
        setItems((data ?? []) as JoinableDirectoryRow[]);
      }

      setLoading(false);
    }

    loadJoinableDirectory();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const canSubmit =
    displayName.trim().length > 1 &&
    !!directoryId &&
    !loading &&
    !submitting &&
    items.length > 0;

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
          // ✅ directory_id ist hier die selected Gemeinde aus der View (entspricht ditib_directory.id)
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

      // Optional: direkt zum Pending-Screen navigieren
      router.push("/pending");
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Netzwerkfehler beim Senden der Anfrage."
      );
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
            Wähle eine aktivierte Gemeinde aus und sende deine Anfrage. Ein
            ADMIN muss dich freigeben.
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
            Gemeinde (aktiviert)
          </label>

          <div className="mt-2">
            <select
              value={directoryId}
              onChange={(e) => setDirectoryId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/20"
              disabled={loading || submitting || items.length === 0}
            >
              <option value="">
                {loading
                  ? "Lade aktivierte Gemeinden..."
                  : items.length === 0
                  ? "Keine aktivierten Gemeinden verfügbar"
                  : "Bitte auswählen ..."}
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
          ) : items.length === 0 && !loading ? (
            <p className="mt-2 text-sm text-amber-200">
              Aktuell ist keine Gemeinde aktiviert. Ein ADMIN muss zuerst das
              Admin-Setup durchführen.
            </p>
          ) : (
            <p className="mt-2 text-xs text-white/50">
              Es werden nur Gemeinden angezeigt, die bereits im System aktiviert
              wurden.
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
