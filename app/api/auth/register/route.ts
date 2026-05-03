import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { createSession, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * POST /api/auth/register
 *
 * Body: { email: string, password: string }
 *
 * Validates input, ensures the email is not already registered, hashes the
 * password with bcryptjs, inserts a new user, and issues a signed session
 * cookie via `createSession`.
 *
 * Responses:
 *   201 — { success: true } and `Set-Cookie: session=...`
 *   400 — { error: string } on invalid input
 *   409 — { error: 'Email already registered' } when email is taken
 *   500 — { error: 'Internal server error' } on unexpected failures
 */

// Conservative RFC 5322-ish email regex. Good enough for client-supplied
// input; the source of truth is still the unique index on `users.email`.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type RegisterBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { email, password } = body ?? {};

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Invalid email" },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const inserted = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
      })
      .returning({ id: users.id });

    const newUser = inserted[0];
    if (!newUser) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    const response = NextResponse.json(
      { success: true },
      { status: 201 },
    );
    await createSession(newUser.id, response);
    return response;
  } catch (err) {
    // Race condition: another request inserted the same email between our
    // existence check and insert. Surface as 409 to keep the contract clean.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
