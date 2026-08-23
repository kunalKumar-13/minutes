import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/** Routes a signed-out visitor may see. Everything else is the app. */
const PUBLIC_PATHS = ["/", "/login"];

/**
 * Guards the app at the edge.
 *
 * Running before React means an unauthenticated visitor never sees a frame of
 * app UI, and a signed-in visitor hitting /login is bounced straight into the
 * workspace. The cookie's *presence* is what is checked here; whether the token
 * is still valid is settled by the API on the first request, which is the only
 * place that can actually know.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Remember where they were headed so sign-in can finish the journey.
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (signedIn && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Everything except Next internals and files served to anonymous clients.
   *
   * The image extensions were here already; the named metadata files were not,
   * so `/site.webmanifest` and `/robots.txt` reached the guard and 307'd to
   * /login. That made the manifest inert for precisely the signed-out visitors
   * it exists for, and pointed crawlers at a login page instead of the site.
   *
   * This must stay one literal string. Next statically analyses the matcher at
   * build time, so a concatenated expression is not read as a pattern — it
   * silently guards everything instead, including the OG image.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml)$).*)",
  ],
};
