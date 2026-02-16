import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/get-session-context";
import SetupAdminForm from "@/components/setup/SetupAdminForm";

export default async function SetupAdminPage() {
  const ctx = await getSessionContext();

  if (!ctx.userId) redirect("/login");
  if (!ctx.needsSetup) redirect("/app");

  return (
    <div className="min-h-[100svh]">
      <div
        className={[
          "min-h-[100svh] w-full px-4 py-10",
          "flex items-center justify-center",
          "[padding-top:calc(env(safe-area-inset-top)+24px)]",
          "[padding-bottom:calc(env(safe-area-inset-bottom)+24px)]",
        ].join(" ")}
      >
        <div className="w-full max-w-3xl">
          <div className="ui-card p-5 sm:p-8">
            <h1 className="text-2xl font-semibold">Gemeinde einrichten</h1>
            <p className="mt-2 text-sm ui-muted">
              Admin-Setup erstellt den Tenant direkt und generiert einen Invite
              Code für weitere Nutzer.
            </p>

            <div className="mt-6 ui-surface p-4 sm:p-5">
              <SetupAdminForm />
            </div>

            <div className="mt-6">
              <a className="text-sm ui-muted hover:text-[rgb(var(--text))]" href="/setup">
                ← Zurück
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
