import "server-only";

import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, type Task } from "@/lib/db/schema";

/**
 * Server-only data helpers for the (protected) route group.
 *
 * This file deliberately lives inside the `app/(protected)/` route group
 * (and is prefixed with `_` so Next.js does not treat it as a route) so
 * the protected pages have a single, colocated entry point for resolving
 * the current user's session and hydrating their persisted tasks during
 * server rendering.
 *
 * Pairing the session lookup and the Drizzle query here matches the
 * "shared service function (e.g. `lib/tasks/queries.ts → getUserTasks`)"
 * pattern called out by the task list hydration story while keeping the
 * helper inside the frontend territory.
 *
 * Importing `server-only` causes a build-time error if any client
 * component ever transitively imports this module — Drizzle + the DB
 * connection string must never reach the browser bundle.
 */

/**
 * Resolve the userId on the current session cookie, or `null` if the
 * caller is unauthenticated (no cookie, malformed token, expired, or
 * signature mismatch).
 *
 * Uses `next/headers`'s `cookies()` directly — `getSession()` accepts a
 * `Request`, so we hand it a synthetic one whose `Cookie` header is
 * rebuilt from the active request's cookie store. This keeps a single
 * source of truth for session verification (`lib/auth.ts → getSession`)
 * without forcing every server component to construct its own request
 * object.
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const syntheticRequest = new Request("http://internal/", {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });

  const session = await getSession(syntheticRequest);
  return session?.userId ?? null;
}

/**
 * Load every task belonging to the given user, ordered oldest-first to
 * match the GET `/api/tasks` route's contract (`ORDER BY created_at ASC`).
 *
 * This is the server-side equivalent of the GET `/api/tasks` handler —
 * it runs the same Drizzle query without paying for an internal HTTP
 * round-trip or having to forward cookies to ourselves. Use this from
 * server components that need to hydrate the initial render.
 */
export async function getUserTasks(userId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.createdAt));
}
