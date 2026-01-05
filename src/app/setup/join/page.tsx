// src/app/setup/join/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import SetupJoinForm from "@/components/setup/SetupJoinForm";
import LogoutButton from "@/components/auth/LogoutButton";
import { getSetupState } from "@/lib/auth/get-setup-state";

export default async function SetupJoinPage() {
  const state = await getSetupState();

  // Guardrails / konsistenter Flow
  if (state.kind === "LOGGED_OUT") redirect("/login");
  if (state.kind === "READY") redirect("/app");
  if (state.kind === "PENDING") redirect("/pending");
  // state.kind === "NEEDS_SETUP" => hier bleiben

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
        <div className="w-full max-w-3xl">
          <div className="ui-card p-5 sm:p-8">
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
                    Zugang anfragen
                  </h1>
                  <p className="mt-1 text-sm ui-muted">
                    Wähle deine Gemeinde aus dem DITIB-Verzeichnis und stelle
                    eine Anfrage. Ein ADMIN muss dich freigeben.
                  </p>
                </div>
              </div>

              <div className="self-start">
                <LogoutButton />
              </div>
            </div>

            <div className="mt-6 ui-surface p-4 sm:p-5">
              <SetupJoinForm />
            </div>

            <div className="mt-6">
              <a className="ui-muted text-sm hover:text-white" href="/setup">
                ← Zurück
              </a>
            </div>
          </div>

          <div className="mt-4 text-center text-xs ui-muted">
            Datenschutzkonform • Token-basiertes Design • Dark-first
          </div>
        </div>
      </div>
    </div>
  );
}
