"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DirectoryRow = {
  id: string;
  name: string;
  city: string | null;
  postal_code: string | null;
};

export default function SetupJoinForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DirectoryRow | null>(null);
  const [results, setResults] = useState<DirectoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return displayName.trim().length > 1 && !!selected?.id && !loading;
  }, [displayName, selected, loading]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setSearching(true);

      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }

      const { data, error } = await supabase
        .from("ditib_directory")
        .select("id, name, city, postal_code")
        .ilike("name", `%${q}%`)
        .order("name", { ascending: true })
        .limit(20);

      if (cancelled) return;

      if (error) {
        setResults([]);
        setSearching(false);
        return;
      }

      setResults((data ?? []) as DirectoryRow[]);
      setSearching(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [query, supabase]);

  async function submit() {
    setError(null);
    setOk(null);

    if (!selected?.id) {
      setError("Bitte wähle eine Gemeinde aus dem Verzeichnis.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/setup/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName.trim(),
        directory_id: selected.id,
        note: note.trim() || null,
      }),
    });

    setLoading(false);

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (json?.error === "TENANT_NOT_READY") {
        setError(
          "Diese Gemeinde ist noch nicht eingerichtet. Ein ADMIN muss zuerst die Gemeinde einrichten."
        );
        return;
      }
      setError("Anfrage konnte nicht gesendet werden. Bitte erneut versuchen.");
      return;
    }

    setOk("Anfrage wurde gesendet. Bitte warte, bis ein ADMIN dich freigibt.");
    router.push("/pending");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-white/70">Dein Name</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/20"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="z.B. Mehmet Çatalsakal"
        />
      </div>

      <div>
        <label className="text-sm text-white/70">
          Gemeinde (DITIB Directory)
        </label>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/20"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setOk(null);
            setError(null);
          }}
          placeholder="Suche z.B. 'DITIB Berlin'..."
        />

        <div className="mt-2 rounded-xl border border-white/10 bg-white/5">
          {searching ? (
            <div className="px-3 py-2 text-sm text-white/60">Suche...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-white/60">
              {query.trim().length < 2
                ? "Mindestens 2 Zeichen eingeben."
                : "Keine Treffer."}
            </div>
          ) : (
            <div className="max-h-56 overflow-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="w-full border-b border-white/10 px-3 py-2 text-left text-sm hover:bg-white/10 last:border-b-0"
                  onClick={() => {
                    setSelected(r);
                    setQuery(r.name);
                    setResults([]);
                  }}
                >
                  <div className="text-white/90">{r.name}</div>
                  <div className="text-xs text-white/50">
                    {r.postal_code ?? ""} {r.city ?? ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <div className="mt-2 text-xs text-white/60">
            Ausgewählt: <span className="text-white/80">{selected.name}</span>
          </div>
        ) : null}
      </div>

      <div>
        <label className="text-sm text-white/70">Notiz (optional)</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/20"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z.B. Vorstandsmitglied / Kontakt / Hinweis"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {ok ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {ok}
        </div>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="w-full rounded-xl bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {loading ? "Sende..." : "Zugang anfragen"}
      </button>
    </div>
  );
}
