import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Module 1: Authentication — the real gap the codebase had before this
 * sprint (no proxy/middleware file existed at all, so most
 * `/projects/[id]/**` routes had zero auth check and refreshed session
 * cookies had nowhere reliable to write back to from a Server Component
 * read). This is authentication (is anyone signed in?), not authorization/
 * permission management (what may they do?) — the latter is explicitly
 * out of scope this sprint.
 *
 * Named `proxy.ts` (not `middleware.ts`) — Next.js 16 renamed the
 * convention ("Middleware is now called Proxy to better reflect its
 * purpose. The functionality remains the same."), per this app's own
 * AGENTS.md warning to check `node_modules/next/dist/docs/` for breaking
 * changes before writing new code.
 */
const PUBLIC_PATH_PREFIXES = ["/auth", "/review", "/logout", "/invite"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
