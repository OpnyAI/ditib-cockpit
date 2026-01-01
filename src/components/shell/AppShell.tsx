"use client";

import * as React from "react";
import type { Profile, Tenant } from "@/lib/auth/types";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { MobileNav } from "@/components/shell/MobileNav";

export function AppShell({
  tenant,
  profile,
  children,
}: {
  tenant: Tenant;
  profile: Profile;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <Topbar
        tenant={tenant}
        profile={profile}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
      />

      <MobileNav
        tenant={tenant}
        profile={profile}
        open={mobileNavOpen}
        setOpen={setMobileNavOpen}
      />

      <div className={mobileNavOpen ? "pointer-events-none select-none" : ""}>
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 md:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
            <aside className="hidden md:block">
              <Sidebar tenant={tenant} profile={profile} />
            </aside>

            <main className="ui-card min-h-[70vh] p-4 md:p-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
