"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Country = "DE" | "AT" | "CH";

type SetupSuccess = {
  tenant_id: string;
  invite_code: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default function SetupAdminForm() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [country, setCountry] = React.useState<Country>("DE");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<SetupSuccess | null>(null);

  const canSubmit = name.trim().length >= 2 && !loading;

  const inviteLink = React.useMemo(() => {
    if (!success?.invite_code) return "";
    if (typeof window === "undefined") return `/setup/join?code=${success.invite_code}`;
    return `${window.location.origin}/setup/join?code=${success.invite_code}`;
  }, [success?.invite_code]);

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // no-op
    }
  }

  async function submit() {
    if (!canSubmit) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim() || null,
          postal_code: postalCode.trim() || null,
          country,
        }),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        if (isRecord(json) && json.error === "ALREADY_SETUP") {
          setError("Für dieses Profil wurde bereits ein Tenant eingerichtet.");
          return;
        }
        setError("Setup konnte nicht abgeschlossen werden. Bitte erneut versuchen.");
        return;
      }

      const data = isRecord(json) && isRecord(json.data) ? json.data : null;
      const tenant_id = data && typeof data.tenant_id === "string" ? data.tenant_id : "";
      const invite_code = data && typeof data.invite_code === "string" ? data.invite_code : "";

      if (!tenant_id || !invite_code) {
        setError("Setup erfolgreich, aber Antwort unvollständig.");
        return;
      }

      setSuccess({ tenant_id, invite_code });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs ui-muted">Gemeindename*</label>
        <input
          className="ui-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. DITIB Musterstadt"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs ui-muted">Ort</label>
          <input
            className="ui-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="z.B. Berlin"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs ui-muted">PLZ</label>
          <input
            className="ui-input"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="z.B. 10115"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs ui-muted">Land</label>
        <select
          className="ui-input"
          value={country}
          onChange={(e) => setCountry((e.target.value as Country) ?? "DE")}
        >
          <option value="DE">Deutschland (DE)</option>
          <option value="AT">Österreich (AT)</option>
          <option value="CH">Schweiz (CH)</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={!canSubmit}
        className="ui-btn ui-btn-primary h-11 w-full disabled:opacity-60"
      >
        {loading ? "Speichere..." : "Setup abschließen (ADMIN)"}
      </button>

      {success ? (
        <div className="space-y-3 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3">
          <div>
            <div className="text-xs ui-muted">Invite Code</div>
            <div className="mt-1 text-2xl font-semibold tracking-wider">
              {success.invite_code}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyToClipboard(success.invite_code)}
              className="ui-btn h-10 px-3 text-sm"
            >
              Invite Code kopieren
            </button>
            <button
              type="button"
              onClick={() => void copyToClipboard(inviteLink)}
              className="ui-btn h-10 px-3 text-sm"
            >
              Einladungslink kopieren
            </button>
            <button
              type="button"
              onClick={() => {
                router.push("/app");
                router.refresh();
              }}
              className="ui-btn ui-btn-primary h-10 px-3 text-sm"
            >
              Zum Dashboard
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
