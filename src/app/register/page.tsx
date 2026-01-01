"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (pw1.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    if (pw1 !== pw2) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: pw1,
    });

    setLoading(false);

    if (error) {
      setError("Registrierung fehlgeschlagen. Bitte versuche es erneut.");
      return;
    }

    router.push("/setup");
    router.refresh();
  }

  return (
    <div className="min-h-[100svh]">
      <div
        className={[
          "min-h-[100svh] w-full px-4 py-10",
          "flex items-center justify-center",
          "overflow-auto",
          "[padding-top:calc(env(safe-area-inset-top)+24px)]",
          "[padding-bottom:calc(env(safe-area-inset-bottom)+24px)]",
        ].join(" ")}
      >
        <div className="w-full max-w-md">
          <div className="ui-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-14 shrink-0">
                <Image
                  src="/brand/ditib-logo.png"
                  alt="DITIB"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold leading-tight">
                  Account erstellen
                </h1>
                <p className="mt-0.5 text-sm ui-muted">Registrierung</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm ui-muted">E-Mail</label>
                <input
                  className="ui-input mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm ui-muted">Passwort</label>
                <input
                  className="ui-input mt-1"
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
                <p className="mt-2 text-xs ui-muted">Mindestens 8 Zeichen.</p>
              </div>

              <div>
                <label className="text-sm ui-muted">Passwort bestätigen</label>
                <input
                  className="ui-input mt-1"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="ui-btn ui-btn-primary w-full px-4 py-3 text-sm"
              >
                {loading ? "Erstelle..." : "Registrieren"}
              </button>
            </form>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="ui-btn w-full px-4 py-3"
              >
                Zurück zum Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
