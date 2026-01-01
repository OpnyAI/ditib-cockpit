"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  className?: string;
  label?: string;
};

export default function LogoutButton({ className, label = "Logout" }: Props) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onLogout() {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);

      // Hard redirect, damit wirklich alles “frisch” ist
      window.location.assign("/login");
    } catch (e: any) {
      setError(e?.message ?? "Logout fehlgeschlagen.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onLogout}
        disabled={loading}
        className="ui-btn h-10 px-4"
      >
        {loading ? "Logout..." : label}
      </button>

      {error ? (
        <p className="mt-2 text-xs text-red-700 dark:text-red-200">{error}</p>
      ) : null}
    </div>
  );
}
