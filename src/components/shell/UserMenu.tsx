// src/components/shell/UserMenu.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  fullWidth?: boolean;
};

export function UserMenu({ fullWidth }: Props) {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  async function onLogout() {
    try {
      await supabase.auth.signOut();
    } finally {
      // Nach Logout sauber raus. (Login-Route existiert in eurem Setup)
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className={[
        // Nutzt eure bestehenden "ui"-Klassen (Design bleibt konsistent).
        "ui-btn ui-btn-ghost h-11",
        fullWidth ? "w-full justify-between" : "",
      ].join(" ")}
      aria-label="Abmelden"
    >
      <span className="text-sm font-medium">Abmelden</span>
      <span className="ui-row-chevron">›</span>
    </button>
  );
}

export default UserMenu;
