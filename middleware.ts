import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Niemals Assets / Next intern anfassen
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml");

  if (isStatic) {
    return NextResponse.next();
  }

  // 2) Supabase SSR Client über Cookies (Middleware-sicher)
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Cookies müssen auf die Response geschrieben werden
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 3) Session/User prüfen
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthed = !!user;

  // 4) Public Routes (ohne Login erreichbar)
  const publicRoutes = ["/login", "/register", "/setup", "/pending"];
  const isPublic = publicRoutes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // 5) Private App Bereich
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");

  // Wenn NICHT eingeloggt und in /app -> zu /login
  if (!isAuthed && isAppRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Wenn eingeloggt und auf /login oder /register -> zu /app
  if (isAuthed && (pathname === "/login" || pathname === "/register")) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Ansonsten: durchlassen (inkl. /setup und /pending)
  return response;
}

export const config = {
  matcher: [
    /**
     * Alles matchen, außer:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * (zusätzlich filtern wir oben weitere Pfade wie /brand/)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
