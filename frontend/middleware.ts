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
  // Everything except Next internals, the favicon and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
