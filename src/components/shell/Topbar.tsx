import type { Profile, Tenant } from "@/lib/auth/types";
import { UserMenu } from "@/components/shell/UserMenu";

export function Topbar({
  tenant,
  profile,
  mobileNavOpen,
  setMobileNavOpen,
}: {
  tenant: Tenant;
  profile: Profile;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
}) {
  const logoSrc = tenant.logo_url || "/brand/ditib-logo.png";

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="ui-btn ui-btn-ghost h-10 w-10 p-0"
              aria-label={mobileNavOpen ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={mobileNavOpen}
            >
              <span className="sr-only">Toggle Menu</span>
              <span className="flex flex-col gap-1">
                <span className="h-[2px] w-5 rounded-full bg-[rgb(var(--text))]" />
                <span className="h-[2px] w-5 rounded-full bg-[rgb(var(--text))]" />
                <span className="h-[2px] w-5 rounded-full bg-[rgb(var(--text))]" />
              </span>
            </button>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="Logo"
                className="max-h-7 max-w-7 object-contain"
              />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">
                {tenant.name}
              </div>
              <div className="truncate text-xs ui-muted">
                {profile.display_name ?? "—"} · {profile.role}
              </div>
            </div>
          </div>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
