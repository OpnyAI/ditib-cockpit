// src/app/pending/page.tsx
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { getSetupState } from "@/lib/auth/get-setup-state";
import { redirect } from "next/navigation";

export default async function PendingPage() {
  const state = await getSetupState();

  // Absicherung
  if (state.kind === "LOGGED_OUT") redirect("/login");
  if (state.kind === "READY") redirect("/app");
  if (state.kind === "NEEDS_SETUP") redirect("/setup");

  // state.kind === "PENDING"
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-2xl items-start px-4 py-8 sm:items-center sm:py-0">
        <div className="ditib-card w-full rounded-2xl p-5 text-white sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                <h1 className="text-2xl font-semibold leading-tight">
                  Anfrage eingegangen ✅
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  Deine Anfrage wartet auf Freigabe durch einen
                  ADMIN/Präsidenten der Gemeinde.
                </p>
              </div>
            </div>

            <div className="self-start">
              <LogoutButton />
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
            <p className="text-sm text-white/80">
              Tipp: Sobald du freigeschaltet bist, gelangst du automatisch ins
              Dashboard – spätestens nach dem nächsten Login oder Reload.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="ditib-btn inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium sm:w-auto"
            >
              Status prüfen / Reload
            </Link>

            <Link
              href="/setup/join"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/10 sm:w-auto"
            >
              Andere Gemeinde anfragen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
