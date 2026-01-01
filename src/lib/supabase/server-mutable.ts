import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server client that can safely set cookies (Route Handlers / Server Actions usage).
 * Next.js 15/16: cookies() can be async-typed -> we await it here.
 *
 * Keep export name `createSupabaseServerClient` because existing routes import it.
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
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // noop (e.g. in some server contexts cookies are readonly)
        }
      },
    },
  });
}

/**
 * Optional alias, falls du semantisch trennen willst.
 */
export const createSupabaseServerMutableClient = createSupabaseServerClient;
