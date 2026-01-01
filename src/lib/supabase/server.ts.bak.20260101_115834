// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

/**
 * Server-Supabase Client für Server Components (read-only Cookie Zugriff).
 * Wichtig: In Server Components dürfen Cookies NICHT geschrieben werden.
 * Deswegen ist setAll ein No-Op. Cookie-Updates laufen später über Route Handlers.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(_cookiesToSet) {
        // Server Components dürfen keine Cookies setzen -> bewusst leer
      },
    },
  });
}
