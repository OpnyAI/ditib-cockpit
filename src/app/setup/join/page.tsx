import Image from "next/image";
import { redirect } from "next/navigation";
import SetupJoinForm from "@/components/setup/SetupJoinForm";
import LogoutButton from "@/components/auth/LogoutButton";
import { getSetupState } from "@/lib/auth/get-setup-state";

export default async function SetupJoinPage() {
  const state = await getSetupState();

  if (state.kind === "LOGGED_OUT") redirect("/login");
  if (state.kind === "READY") redirect("/app");
  if (state.kind === "PENDING") redirect("/pending");

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
                    Gib deinen Invite Code ein. Ein ADMIN muss deine Anfrage
                    freigeben.
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
              <a className="text-sm ui-muted hover:text-[rgb(var(--text))]" href="/setup">
                ← Zurück
              </a>
            </div>
          </div>

          <div className="mt-4 text-center text-xs ui-muted">
            Einladungscode-basiert • PENDING/APPROVED Flow bleibt aktiv
          </div>
        </div>
      </div>
    </div>
  );
}
