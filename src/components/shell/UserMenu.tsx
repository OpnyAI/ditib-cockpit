"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UserMenu() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onLogout = async () => {
    setPending(true);
    await supabase.auth.signOut();
    setPending(false);
    router.replace("/login");
  };

  return (
    <button onClick={onLogout} disabled={pending} className="ui-btn h-10 px-4">
      {pending ? "…" : "Logout"}
    </button>
  );
}
