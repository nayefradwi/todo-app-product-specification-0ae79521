import { redirect } from "next/navigation";

import { TaskListClient } from "@/components/task-list-client";

import { getSessionUserId, getUserTasks } from "./_data";

/**
 * Task list page (`/`).
 *
 * Server Component. Resolves the current session via `getSessionUserId()`
 * (which reads the `session` cookie via `cookies()` from `next/headers`
 * and verifies it through the shared `getSession` helper) and, if the
 * user is unauthenticated, calls `redirect('/login')` from
 * `next/navigation`. Otherwise it hydrates the initial render by calling
 * `getUserTasks(userId)` — the server-side equivalent of GET
 * `/api/tasks` — and passes the resulting list down to
 * `<TaskListClient>` as `initialTasks`.
 *
 * Server-side hydration eliminates the flash-of-empty-list on first
 * load and proves persistence: after logout and re-login the very first
 * HTML response already contains the user's previously saved tasks, so
 * there is no client-side fetch shimmer.
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

export default async function TasksHomePage() {
  const userId = await getSessionUserId();
  if (!userId) {
    // `redirect()` throws a special error to short-circuit rendering, so
    // anything below this guard is only reached for authenticated users.
    redirect("/login");
  }

  const initialTasks = await getUserTasks(userId);

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
