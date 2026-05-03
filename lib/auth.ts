import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

/**
 * Shared auth utilities used by every auth-related route and middleware.
 *
 * Implements:
 *   - password hashing/verification via bcryptjs (salt rounds 10)
 *   - signed-JWT session cookies via jose
 *
 * The session cookie is named `session`, HTTP-only, signed with HS256 using
 * `process.env.SESSION_SECRET`, and expires 7 days after issuance.
 */

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const BCRYPT_SALT_ROUNDS = 10;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to your environment (see .env.example).",
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Hash a plaintext password with bcryptjs (salt rounds 10).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Sign a session JWT with payload `{ sub: userId }` and 7-day expiry.
 * Exported for callers that need the raw token.
 */
export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

function buildSessionCookie(value: string, maxAge: number): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  if (maxAge === 0) {
    // Belt-and-suspenders for cookie clearing.
    parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  }
  return parts.join("; ");
}

/**
 * Issue a signed session cookie on the given response.
 *
 * Note: signing the JWT with jose is asynchronous, so this helper returns a
 * Promise. Route handlers should `await createSession(...)` before returning
 * the response.
 */
export async function createSession(
  userId: string,
  res: Response,
): Promise<void> {
  const token = await signSessionToken(userId);
  res.headers.append(
    "Set-Cookie",
    buildSessionCookie(token, SESSION_MAX_AGE_SECONDS),
  );
}

function parseCookieHeader(header: string | null | undefined): Map<string, string> {
  const out = new Map<string, string>();
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) out.set(name, decodeURIComponent(value));
  }
  return out;
}

function readSessionCookie(req: Request | NextRequest): string | null {
  // NextRequest exposes a typed `.cookies.get(name)` API; fall back to
  // parsing the raw `Cookie` header for plain `Request` objects.
  const maybeNext = req as NextRequest;
  if (
    maybeNext &&
    typeof (maybeNext as { cookies?: unknown }).cookies === "object" &&
    maybeNext.cookies !== null &&
    typeof (maybeNext.cookies as { get?: unknown }).get === "function"
  ) {
    const entry = maybeNext.cookies.get(SESSION_COOKIE_NAME);
    if (entry?.value) return entry.value;
  }
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  return cookies.get(SESSION_COOKIE_NAME) ?? null;
}

/**
 * Verify and decode the `session` cookie. Returns `null` if the cookie is
 * missing, malformed, expired, or fails signature verification.
 */
export async function getSession(
  req: Request | NextRequest,
): Promise<{ userId: string } | null> {
  const token = readSessionCookie(req);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      return null;
    }
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

/**
 * Expire the session cookie on the given response.
 */
export function clearSession(res: Response): void {
  res.headers.append("Set-Cookie", buildSessionCookie("", 0));
}
