import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server client for general server usage (Server Components / Server Actions).
 * Next.js 15/16: cookies() can be async-typed -> we await it here.
 *
 * Keep export name `createSupabaseServerClient` because existing imports may rely on it.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Components, setting cookies might throw in some contexts.
        // We keep it safe.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // noop
        }
      },
    },
  });
}

/**
 * Optional alias, falls du es semantisch trennen willst.
 */
export const createSupabaseServerReadClient = createSupabaseServerClient;
