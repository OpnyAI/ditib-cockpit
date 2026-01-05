"use client";

import type { Profile } from "@/lib/auth/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/finance", label: "Finanzen" },
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

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const isAdmin = profile.role === "ADMIN";

  return (
    <nav className="ui-card p-3">
      <div className="space-y-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);

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

      {isAdmin ? (
        <>
          <div className="my-3 h-px w-full bg-[rgb(var(--border))]/60" />

          <div className="px-1 pb-2 pt-1">
            <div className="text-[12px] tracking-wide ui-muted">Admin</div>
          </div>

          <div className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const active = isActive(pathname, item.href);

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

      {/* subtiler Footer-Spacer, damit es nicht so “abgeschnitten” wirkt */}
      <div className="mt-3 h-px w-full bg-[rgb(var(--border))]/60" />
      <div className="mt-3 text-xs ui-muted leading-5">
        Schnellzugriff auf Module
      </div>
    </nav>
  );
}
