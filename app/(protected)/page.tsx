import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { TaskListClient } from "@/components/task-list-client";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";

/**
 * Task list page (`/`).
 *
 * Server Component. Reads the session cookie via `cookies()` from
 * `next/headers` and, if absent or invalid, calls `redirect('/login')`
 * from `next/navigation`. Otherwise queries the user's tasks directly
 * via Drizzle (no internal HTTP roundtrip — the GET /api/tasks route
 * uses the same schema, but calling the DB here is cheaper and avoids
 * needing to forward cookies to ourselves) and passes the resulting
 * list down to the `<TaskListClient>` wrapper component.
 *
 * `<TaskListClient>` owns the in-page task state and composes
 * `<AddTaskForm>` and `<TaskList>` together so newly created tasks can
 * be appended without a page reload. Per-row toggle-completed and
 * delete interactions are owned by the corresponding components.
 *
 * The session check here is a defense-in-depth guard: even if no app
 * middleware is configured (or the (protected) layout is bypassed via
 * a routing change), an unauthenticated request to `/` will still be
 * server-side redirected to `/login` before any task data is rendered.
 *
 * # Redirect-loop safety
 *
 * The `/login` and `/register` pages live OUTSIDE the `(protected)`
 * route group and have no server-side auth check of their own, so they
 * are reachable without a session. There is no app-level
 * `middleware.ts`, so no global matcher needs `/login` and `/register`
 * exclusions — they are inherently public. If a future middleware is
 * added, its `config.matcher` MUST exclude `/login`, `/register`, and
 * the public `/api/auth/*` routes to avoid a redirect loop.
 *
 * Acceptance check: hitting `/` server-side without a `session` cookie
 * (e.g. `curl -i http://host/`) returns a 307 to `/login`; hitting
 * `/login` or `/register` without a session returns the page HTML.
 */

// Disable static rendering — this page is per-user and depends on cookies.
export const dynamic = "force-dynamic";

async function getTasksForCurrentUser() {
  // Per task spec: read the session cookie via `cookies()` from
  // `next/headers`. `getSession` accepts a `Request`, so synthesize a
  // minimal one whose `Cookie` header is rebuilt from the
  // ReadonlyRequestCookies store.
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const fakeRequest = new Request("http://internal/", {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });

  const session = await getSession(fakeRequest);
  if (!session) {
    // `redirect()` throws a special error to short-circuit rendering.
    redirect("/login");
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, session.userId))
    .orderBy(asc(tasks.createdAt));

  return rows;
}

export default async function TasksHomePage() {
  const initialTasks = await getTasksForCurrentUser();

  return (
    <section className="mx-auto flex min-h-full w-full max-w-xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Stay on top of what you need to get done.
        </p>
      </header>

      <TaskListClient initialTasks={initialTasks} />
    </section>
  );
}
