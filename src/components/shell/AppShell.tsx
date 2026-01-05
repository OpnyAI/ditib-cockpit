"use client";

import type { Profile, Tenant } from "@/lib/auth/types";
import { useEffect, useState } from "react";
import { Topbar } from "@/components/shell/Topbar";
import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav } from "@/components/shell/MobileNav";
import { ensureWebPushSubscribed } from "@/lib/push/client";

export function AppShell({
  tenant,
  profile,
  children,
}: {
  tenant: Tenant;
  profile: Profile;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Push leise initialisieren – UI bleibt unverändert
    ensureWebPushSubscribed().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <Topbar
        tenant={tenant}
        profile={profile}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
      />

      {/* Layout container */}
      <div className="mx-auto w-full max-w-[1760px] px-4 md:px-8">
        <div className="py-6 md:py-10">
          <div className="md:flex md:items-start md:gap-10 lg:gap-12">
            {/* Sidebar */}
            <aside className="hidden md:block md:w-[240px] lg:w-[260px] md:shrink-0">
              <div className="md:sticky md:top-[96px]">
                <Sidebar profile={profile} />
              </div>
            </aside>

            {/* Main */}
            <main className="min-w-0 flex-1 max-w-none">
              <div className="max-w-none">{children}</div>
            </main>
          </div>
        </div>
      </div>

      <MobileNav
        tenant={tenant}
        profile={profile}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </div>
  );
}
