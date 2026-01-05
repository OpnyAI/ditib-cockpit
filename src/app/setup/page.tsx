import Image from "next/image";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { getSetupState } from "@/lib/auth/get-setup-state";

export default async function SetupPage() {
  const state = await getSetupState();

  // Wenn alles bereit ist → direkt ins App-Dashboard
  if (state.kind === "READY") redirect("/app");
  if (state.kind === "PENDING") redirect("/pending");

  const isLoggedOut = state.kind === "LOGGED_OUT";

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
                    Setup
                  </h1>
                  <p className="mt-1 text-sm ui-muted">
                    Deine Gemeinde wird zentral von einem Präsidenten (ADMIN)
                    eingerichtet. Danach kannst du Zugang anfragen und wirst
                    freigeschaltet.
                  </p>
                </div>
              </div>

              {/* Logout nur anzeigen, wenn man eingeloggt ist */}
              {!isLoggedOut ? (
                <div className="self-start">
                  <LogoutButton />
                </div>
              ) : null}
            </div>

            {/* LOGGED_OUT: Öffentliche Onboarding-Ansicht */}
            {isLoggedOut ? (
              <>
                <div className="mt-6 ui-surface p-4 sm:p-5">
                  <div className="text-xs ui-muted">Erster Schritt</div>
                  <div className="mt-1 text-lg font-semibold">
                    Account erstellen oder einloggen
                  </div>
                  <p className="mt-2 text-sm ui-muted">
                    Um einer Gemeinde beizutreten und Push/E-Mail Updates zu
                    erhalten, brauchst du einen Account. Danach kannst du deinen
                    Zugang zur Gemeinde anfragen.
                  </p>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <a
                      href="/register"
                      className="ui-btn ui-btn-primary inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium sm:w-auto"
                    >
                      Neuen Account erstellen
                    </a>

                    <a
                      href="/login"
                      className="ui-btn inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium sm:w-auto"
                    >
                      Einloggen
                    </a>
                  </div>
                </div>

                <div className="mt-6 ui-surface p-4 sm:p-5">
                  <div className="text-xs ui-muted">Hinweis</div>
                  <div className="mt-1 text-lg font-semibold">
                    Was passiert danach?
                  </div>
                  <p className="mt-2 text-sm ui-muted">
                    Nach dem Login wirst du – falls du noch keiner Gemeinde
                    zugeordnet bist – automatisch hierher geführt und kannst
                    dann die konkrete Gemeinde auswählen und eine Anfrage
                    stellen.
                  </p>
                </div>
              </>
            ) : (
              /* LOGGED_IN aber noch nicht READY/PENDING: Zugang anfragen */
              <>
                <div className="mt-6 ui-surface p-4 sm:p-5">
                  <div className="text-xs ui-muted">Mitglied / Vorstand</div>
                  <div className="mt-1 text-lg font-semibold">
                    Zugang anfragen
                  </div>
                  <p className="mt-2 text-sm ui-muted">
                    Wähle deine Gemeinde aus dem DITIB-Verzeichnis und stelle
                    eine Anfrage. Ein ADMIN gibt dich frei.
                  </p>

                  <div className="mt-4">
                    <a
                      href="/setup/join"
                      className="ui-btn ui-btn-primary inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium sm:w-auto"
                    >
                      Zugang anfragen
                    </a>
                  </div>
                </div>

                <p className="mt-6 text-xs ui-muted">
                  Präsident (ADMIN)? Dann nutze den speziellen Admin-Setup-Link,
                  den du von uns bekommst.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
