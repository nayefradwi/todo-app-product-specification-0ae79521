import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * POST /api/auth/login
 *
 * Body: { email: string, password: string }
 *
 * Looks up the user by (lowercased) email, verifies the supplied password
 * against the stored bcrypt hash, and on success issues a signed session
 * cookie via `createSession` from `lib/auth.ts` (the helper established by
 * the registration story).
 *
 * Responses:
 *   200 — { ok: true } and `Set-Cookie: session=...`
 *   400 — { error: string } when email or password is missing
 *   401 — { error: 'Invalid credentials' } on unknown email or bad password
 *   500 — { error: 'Internal server error' } on unexpected failures
 *
 * The 401 response intentionally uses the same opaque message for both
 * "email not found" and "wrong password" so we don't leak which emails
 * have accounts.
 */

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { email, password } = body ?? {};

  if (typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const found = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const user = found[0];
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });
    await createSession(user.id, response);
    return response;
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
