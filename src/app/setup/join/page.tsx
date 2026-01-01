import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/get-session-context";
import SetupJoinForm from "@/components/setup/SetupJoinForm";

export default async function SetupJoinPage() {
  const ctx = await getSessionContext();

  if (!ctx.userId) redirect("/login");
  if (!ctx.needsSetup) redirect("/app");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-2xl font-semibold">Zugang anfragen</h1>
          <p className="mt-2 text-sm text-white/60">
            Wähle deine Gemeinde aus dem DITIB-Verzeichnis und stelle eine
            Anfrage. Ein ADMIN muss dich freigeben.
          </p>

          <div className="mt-6">
            <SetupJoinForm />
          </div>

          <div className="mt-6">
            <a className="text-sm text-white/60 hover:text-white" href="/setup">
              ← Zurück
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
