"use client";

import type { Profile } from "@/lib/auth/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/finance", label: "Finanzen" },
  { href: "/app/members", label: "Mitglieder" },
  { href: "/app/communication", label: "Mitteilungen" },
  { href: "/app/events", label: "Termine" },
  { href: "/app/settings", label: "Einstellungen" },
];

const ADMIN_NAV = [{ href: "/app/admin/requests", label: "Join Requests" }];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();

  // Defensive (falls irgendwo kurz undefined reinkommt – verhindert Crashes)
  const role = profile?.role ?? "MITARBEITER";
  const isAdmin = role === "ADMIN";

  return (
    <nav className="ui-card p-3">
      <div className="space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                // WICHTIG: block + flex + padding => kein “zusammenkleben”
                "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm",
                "transition-colors",
                "hover:bg-[rgb(var(--surface-2))]/60",
                active
                  ? "bg-[rgb(var(--surface-2))]/70 border border-[rgb(var(--border))]"
                  : "border border-transparent",
              ].join(" ")}
            >
              <span className="font-medium">{item.label}</span>

              <span
                className={[
                  "ui-muted transition-transform",
                  "group-hover:translate-x-[1px]",
                ].join(" ")}
                aria-hidden
              >
                ›
              </span>
            </Link>
          );
        })}
      </div>

      {/* Admin-Bereich nur für ADMIN */}
      {isAdmin ? (
        <>
          <div className="mt-4 h-px w-full bg-[rgb(var(--border))]/60" />
          <div className="mt-3 text-xs ui-muted leading-5">Admin</div>

          <div className="mt-2 space-y-1">
            {ADMIN_NAV.map((item) => {
              const active = pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm",
                    "transition-colors",
                    "hover:bg-[rgb(var(--surface-2))]/60",
                    active
                      ? "bg-[rgb(var(--surface-2))]/70 border border-[rgb(var(--border))]"
                      : "border border-transparent",
                  ].join(" ")}
                >
                  <span className="font-medium">{item.label}</span>

                  <span
                    className={[
                      "ui-muted transition-transform",
                      "group-hover:translate-x-[1px]",
                    ].join(" ")}
                    aria-hidden
                  >
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      ) : null}

      {/* subtiler Footer-Spacer */}
      <div className="mt-4 h-px w-full bg-[rgb(var(--border))]/60" />
      <div className="mt-3 text-xs ui-muted leading-5">
        Schnellzugriff auf Module
      </div>
    </nav>
  );
}
