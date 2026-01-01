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
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-md items-start px-4 py-8 sm:items-center sm:py-0">
        <div className="ditib-card w-full rounded-2xl p-5 text-white sm:p-6">
          {/* Header */}
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
              <h1 className="text-xl font-semibold leading-tight">
                Account erstellen
              </h1>
              <p className="mt-0.5 text-sm text-white/60">Registrierung</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-white/70">E-Mail</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Passwort</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/20"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <p className="mt-2 text-xs text-white/50">
                Mindestens 8 Zeichen.
              </p>
            </div>

            <div>
              <label className="text-sm text-white/70">
                Passwort bestätigen
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-white/20"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="ditib-btn w-full rounded-xl px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Erstelle..." : "Registrieren"}
            </button>
          </form>

          {/* Actions */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Zurück zum Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
