import Image from "next/image";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { getSetupState } from "@/lib/auth/get-setup-state";

export default async function SetupPage() {
  const state = await getSetupState();

  if (state.kind === "LOGGED_OUT") redirect("/login");
  if (state.kind === "READY") redirect("/app");
  if (state.kind === "PENDING") redirect("/pending");

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-3xl items-start px-4 py-8 sm:items-center sm:py-0">
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
                <h1 className="text-2xl font-semibold leading-tight">Setup</h1>
                <p className="mt-1 text-sm text-white/70">
                  Deine Gemeinde wird zentral von einem Präsidenten (ADMIN)
                  eingerichtet. Danach kannst du Zugang anfragen und wirst
                  freigeschaltet.
                </p>
              </div>
            </div>

            <div className="self-start">
              <LogoutButton />
            </div>
          </div>

          {/* Card */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
            <div className="text-xs text-white/60">Mitglied / Vorstand</div>
            <div className="mt-1 text-lg font-semibold">Zugang anfragen</div>
            <p className="mt-2 text-sm text-white/70">
              Wähle deine Gemeinde aus dem DITIB-Verzeichnis und stelle eine
              Anfrage. Ein ADMIN gibt dich frei.
            </p>

            <div className="mt-4">
              <a
                href="/setup/join"
                className="ditib-btn inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium sm:w-auto"
              >
                Zugang anfragen
              </a>
            </div>
          </div>

          <p className="mt-6 text-xs text-white/50">
            Präsident (ADMIN)? Dann nutze den speziellen Admin-Setup-Link, den
            du von uns bekommst.
          </p>
        </div>
      </div>
    </div>
  );
}
