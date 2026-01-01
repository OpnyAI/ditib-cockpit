import Link from "next/link";
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

export function Sidebar({
  tenant,
  profile,
}: {
  tenant: Tenant;
  profile: Profile;
}) {
  const items = NAV.filter((i) => i.roles.includes(profile.role));
  const logoSrc = tenant.logo_url || "/brand/ditib-logo.png";

  return (
    <div className="ui-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="Logo"
            className="max-h-8 max-w-8 object-contain"
          />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{tenant.name}</div>
          <div className="text-xs ui-muted">{profile.role}</div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm hover:border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))]"
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-2 py-0.5 text-xs ui-muted">
                {item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
        <div className="text-xs ui-muted">Öffentliche Seiten</div>
        <div className="mt-2 text-sm">
          <Link
            href={`/g/${tenant.slug}`}
            className="break-all underline decoration-[rgb(var(--border))] underline-offset-4 hover:opacity-80"
          >
            /g/{tenant.slug}
          </Link>
        </div>
      </div>
    </div>
  );
}
