"use client";

import type { Profile, Tenant } from "@/lib/auth/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { UserMenu } from "@/components/shell/UserMenu";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/finance", label: "Finanzen" },
  { href: "/app/members", label: "Mitglieder" },
  { href: "/app/members/fees", label: "Beiträge Übersicht" },
  { href: "/app/communication", label: "Mitteilungen" },
  { href: "/app/events", label: "Termine" },
  { href: "/app/settings", label: "Einstellungen" },
];

const ADMIN_NAV = [{ href: "/app/admin/requests", label: "Join Requests" }];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

export function MobileNav({
  tenant,
  profile,
  open,
  onClose,
}: {
  tenant: Tenant;
  profile: Profile;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const logoSrc = tenant.logo_url || "/brand/ditib-logo.png";
  const isAdmin = profile.role === "ADMIN";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop (blurred, click to close) */}
      <button
        type="button"
        className="ui-backdrop"
        aria-label="Menü schließen"
        onClick={onClose}
      />

      {/* Centered iOS-like Sheet */}
      <div
        className={[
          "absolute inset-0",
          "flex items-start justify-center",
          // Safe area top + spacing
          "px-4 pt-[calc(env(safe-area-inset-top)+14px)]",
          "pb-[calc(env(safe-area-inset-bottom)+14px)]",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={[
            "ui-card ui-sheet-in",
            "w-full max-w-[420px]",
            "max-h-[calc(100dvh-32px-env(safe-area-inset-top)-env(safe-area-inset-bottom))]",
            "overflow-hidden",
          ].join(" ")}
        >
          {/* Grabber */}
          <div className="flex justify-center pt-3">
            <div className="ui-grabber" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoSrc}
                  alt="Logo"
                  className="max-h-7 max-w-7 object-contain"
                />
              </div>

              <div className="min-w-0 leading-tight">
                <div className="truncate text-[15px] font-semibold">
                  {tenant.name}
                </div>
                <div className="truncate text-[13px] ui-muted">
                  {profile.display_name ?? "—"} · {profile.role}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ui-btn ui-btn-ghost h-10 w-10 p-0"
              aria-label="Schließen"
            >
              <span className="sr-only">Schließen</span>
              <span className="text-[18px] leading-none">×</span>
            </button>
          </div>

          <div className="ui-divider" />

          {/* Content (scroll if needed) */}
          <div className="max-h-[calc(100dvh-180px)] overflow-auto px-4 pb-4">
            {/* Navigation */}
            <div className="pt-4">
              <div className="text-[12px] tracking-wide ui-muted">
                Navigation
              </div>

              <div className="mt-3 space-y-2">
                {NAV.map((item) => {
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={[
                        "ui-row",
                        active ? "ui-row-active" : "ui-row-idle",
                      ].join(" ")}
                    >
                      <span className="text-[16px] font-medium">
                        {item.label}
                      </span>
                      <span className="ui-row-chevron">›</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Admin */}
            {isAdmin ? (
              <div className="pt-6">
                <div className="text-[12px] tracking-wide ui-muted">Admin</div>

                <div className="mt-3 space-y-2">
                  {ADMIN_NAV.map((item) => {
                    const active = isActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={[
                          "ui-row",
                          active ? "ui-row-active" : "ui-row-idle",
                        ].join(" ")}
                      >
                        <span className="text-[16px] font-medium">
                          {item.label}
                        </span>
                        <span className="ui-row-chevron">›</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="pt-6">
              <div className="text-[12px] tracking-wide ui-muted">Aktionen</div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <ThemeToggle fullWidth />
                <UserMenu fullWidth />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
