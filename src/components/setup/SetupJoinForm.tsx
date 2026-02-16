"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

function normalizeInviteCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export default function SetupJoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inviteCode, setInviteCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fromQuery = searchParams.get("code");
    if (!fromQuery) return;
    setInviteCode(normalizeInviteCode(fromQuery));
  }, [searchParams]);

  const canSubmit = normalizeInviteCode(inviteCode).length >= 6 && !loading;

  async function submit() {
    setError(null);
    setOk(null);
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch("/api/setup/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: normalizeInviteCode(inviteCode) }),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        if (isRecord(json) && typeof json.error === "string") {
          if (json.error === "INVITE_CODE_INVALID") {
            setError("Invite Code ist ungültig oder deaktiviert.");
            return;
          }
          if (json.error === "ALREADY_IN_TENANT") {
            setError("Du bist bereits einer Gemeinde zugeordnet.");
            return;
          }
        }
        setError("Anfrage konnte nicht gesendet werden. Bitte erneut versuchen.");
        return;
      }

      const alreadyPending =
        isRecord(json) && isRecord(json.data) && json.data.alreadyPending === true;
      setOk(
        alreadyPending
          ? "Anfrage ist bereits offen. Bitte warte auf die Freigabe durch den ADMIN."
          : "Anfrage gesendet. Ein ADMIN muss deinen Beitritt freigeben.",
      );

      router.push("/pending");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs ui-muted">Invite Code*</label>
        <input
          className="ui-input uppercase tracking-wider"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="z.B. AB7K9M2Q"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="mt-2 text-xs ui-muted">
          Du erhältst den Invite Code vom Gemeinde-ADMIN.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {ok ? (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {ok}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={!canSubmit}
        className="ui-btn ui-btn-primary h-11 w-full disabled:opacity-60"
      >
        {loading ? "Sende..." : "Anfrage senden"}
      </button>

      <div className="text-xs ui-muted">
        Nach dem Absenden bleibt dein Status auf <strong>PENDING</strong>, bis
        ein ADMIN dich freischaltet.
      </div>
    </div>
  );
}
