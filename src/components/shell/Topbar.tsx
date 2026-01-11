"use client";

import type { Profile, Tenant } from "@/lib/auth/types";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
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
    <header className="sticky top-0 z-40">
      {/* thin frosted header */}
      <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/70 backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--surface))]/60">
        <div className="mx-auto flex w-full max-w-[1760px] items-center justify-between px-4 py-2.5 md:px-6">
          {/* LEFT */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className={[
                  "ui-btn ui-btn-ghost h-9 w-9 rounded-xl p-0",
                  "transition active:translate-y-[1px]",
                  mobileNavOpen ? "bg-[rgb(var(--surface-2))]/70" : "",
                ].join(" ")}
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
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt="Logo"
                  className="max-h-6 max-w-6 object-contain"
                />
              </div>

              <div className="min-w-0 leading-tight">
                <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[rgb(var(--fg))]">
                  {tenant.name}
                </div>

                <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                  <div className="truncate ui-small ui-muted">
                    {profile.display_name ?? "—"}
                  </div>

                  <span
                    className="h-1 w-1 rounded-full bg-[rgb(var(--border))]"
                    aria-hidden
                  />

                  <span className="shrink-0 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/55 px-2 py-0.5 text-[11px] font-medium tracking-wide text-[rgb(var(--text))]/80">
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT (Desktop actions) */}
          <div className="hidden items-center md:flex">
            {/* compact system controls */}
            <div className="flex items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/35 px-2 py-1.5 shadow-sm">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
