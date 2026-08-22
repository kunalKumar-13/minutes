/**
 * Where the session token lives, and who is allowed to read it.
 *
 * The token is kept in a cookie rather than `localStorage` for one specific
 * reason: Next.js middleware runs on the edge, before React exists, and can
 * only see cookies. That is what lets an unauthenticated request to /home be
 * redirected to /login without a flash of app UI.
 */
export const SESSION_COOKIE = "ff_session";

export function readToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function writeToken(token: string, expiresAt: string): void {
  if (typeof document === "undefined") return;
  const expires = new Date(expiresAt);
  const maxAge = Math.max(60, Math.floor((expires.getTime() - Date.now()) / 1000));
  // `SameSite=Lax` still sends the cookie on top-level navigation, which is
  // what the middleware guard needs. `Secure` only in production — localhost
  // is served over http and the cookie would otherwise be dropped.
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
