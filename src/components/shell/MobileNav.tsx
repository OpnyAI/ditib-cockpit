"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile, Tenant, Role } from "@/lib/auth/types";

type NavItem = {
  href: string;
  label: string;
  roles: Role[];
  badge?: string;
};

const NAV: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    roles: ["ADMIN", "BUCHHALTER", "KOMMUNIKATION"],
  },
  { href: "/app/finance", label: "Finanzen", roles: ["ADMIN", "BUCHHALTER"] },
  {
    href: "/app/communication",
    label: "Mitteilungen",
    roles: ["ADMIN", "KOMMUNIKATION"],
  },
  { href: "/app/events", label: "Termine", roles: ["ADMIN", "KOMMUNIKATION"] },
  { href: "/app/settings", label: "Einstellungen", roles: ["ADMIN"] },
];

export function MobileNav({
  tenant,
  profile,
  open,
  setOpen,
}: {
  tenant: Tenant;
  profile: Profile;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();

  const items = React.useMemo(
    () => NAV.filter((i) => i.roles.includes(profile.role)),
    [profile.role]
  );

  // Scroll lock
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC schließt
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const logoSrc = tenant.logo_url || "/brand/ditib-logo.png";

  return (
    <div
      className={[
        "fixed inset-0 z-[9999] md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        className={[
          "absolute inset-0 transition-opacity",
          open ? "opacity-100" : "opacity-0",
          "bg-black/40 backdrop-blur-sm",
        ].join(" ")}
        aria-label="Menü schließen"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div
        className={[
          "absolute left-0 top-0 h-full w-[86vw] max-w-[360px]",
          "border-r border-[rgb(var(--border))]",
          "bg-[rgb(var(--surface))] text-[rgb(var(--text))]",
          "shadow-2xl",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "p-4",
          "[padding-top:calc(env(safe-area-inset-top)+16px)]",
          "[padding-bottom:calc(env(safe-area-inset-bottom)+16px)]",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
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
              <div className="truncate text-xs ui-muted">{profile.role}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ui-btn h-10 px-3"
            aria-label="Schließen"
          >
            Schließen
          </button>
        </div>

        <nav className="mt-5 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={[
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                  active
                    ? "border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] font-semibold"
                    : "border border-transparent hover:bg-[rgb(var(--surface-2))]",
                ].join(" ")}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-2 py-0.5 text-xs ui-muted">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
          <div className="text-xs ui-muted">Öffentlich</div>
          <div className="mt-2 text-sm break-all">
            <Link
              href={`/g/${tenant.slug}`}
              onClick={() => setOpen(false)}
              className="underline decoration-[rgb(var(--border))] underline-offset-4 hover:opacity-80"
            >
              /g/{tenant.slug}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
