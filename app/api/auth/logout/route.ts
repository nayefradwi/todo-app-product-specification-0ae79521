import { NextResponse } from "next/server";

import { clearSession } from "@/lib/auth";

/**
 * POST /api/auth/logout
 *
 * Ends the current session by clearing the `session` cookie that was issued
 * by the registration / login routes. No database interaction is required —
 * invalidating the cookie is sufficient to log the user out, since session
 * state lives entirely in the signed JWT cookie.
 *
 * The cookie is cleared with the same `Path`, `HttpOnly`, `SameSite` (Lax)
 * and (in production) `Secure` attributes used when it was originally set,
 * along with `Max-Age=0` and an `Expires` date in the past, so the browser
 * actually removes the cookie.
 *
 * Responses:
 *   200 — { success: true } and `Set-Cookie: session=; Max-Age=0; ...`
 */
export async function POST(): Promise<Response> {
  const response = NextResponse.json({ success: true }, { status: 200 });
  clearSession(response);
  return response;
}
