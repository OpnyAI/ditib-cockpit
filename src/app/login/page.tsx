"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Login fehlgeschlagen. Bitte E-Mail/Passwort prüfen.");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <div className="min-h-[100svh]">
      {/* Background / Vibe */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* Soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_50%_-10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_700px_at_0%_100%,rgba(227,6,19,0.08),transparent_55%),radial-gradient(900px_700px_at_100%_90%,rgba(120,140,180,0.10),transparent_55%)]" />
        {/* Subtle grain */}
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

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
                  DITIB Cockpit
                </h1>
                <p className="mt-0.5 text-sm ui-muted">Login</p>
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              className="mt-6 space-y-4"
              aria-busy={loading}
            >
              <div>
                <label className="text-sm ui-muted">E-Mail</label>
                <input
                  className="ui-input mt-1 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  inputMode="email"
                  placeholder="name@domain.de"
                />
              </div>

              <div>
                <label className="text-sm ui-muted">Passwort</label>
                <input
                  className="ui-input mt-1 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  placeholder="••••••••"
                />
              </div>

              {error ? (
                <div className="ui-alert" role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="ui-btn ui-btn-primary w-full px-4 py-3 text-sm"
              >
                {loading ? "Einloggen..." : "Einloggen"}
              </button>
            </form>

            <div className="mt-5 space-y-2 text-sm">
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="ui-btn w-full px-4 py-3"
              >
                Neuen Account erstellen
              </button>

              <button
                type="button"
                onClick={() => router.push("/setup")}
                className="ui-btn w-full px-4 py-3 whitespace-normal leading-snug"
              >
                Zugang zur Gemeinde anfragen / Setup starten
              </button>

              <p className="pt-2 text-xs ui-muted leading-relaxed">
                Tipp: Wenn du nach dem Login keiner Gemeinde zugeordnet bist,
                nutze „Zugang anfragen“.
              </p>
            </div>
          </div>

          {/* Bottom hint */}
          <div className="mt-4 text-center text-xs ui-muted">
            Datenschutzkonform • Token-basiertes Design • Dark-first
          </div>
        </div>
      </div>
    </div>
  );
}
