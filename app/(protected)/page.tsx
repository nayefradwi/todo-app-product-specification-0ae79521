import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";

import { TaskList } from "@/components/task-list";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";

/**
 * Task list page (`/`).
 *
 * Server Component. Reads the session cookie via the shared `getSession`
 * helper and, if absent/invalid, redirects to `/login`. Otherwise queries
 * the user's tasks directly via Drizzle (no internal HTTP roundtrip — the
 * GET /api/tasks route uses the same schema, but calling the DB here is
 * cheaper and avoids needing to forward cookies to ourselves) and passes
 * the resulting list down to the client `<TaskList>` component.
 *
 * `<TaskList>` owns the in-page task state and renders `<AddTaskForm>`
 * itself so newly created tasks can be appended without a page reload.
 * The toggle-completed and delete interactions on each row are still
 * placeholders — they ship in their own follow-up stories.
 */

// Disable static rendering — this page is per-user and depends on cookies.
export const dynamic = "force-dynamic";

async function getTasksForCurrentUser() {
  // `getSession` accepts a Request, so synthesize a minimal one from the
  // incoming headers (which include the `cookie` header) — server
  // components don't expose the underlying Request directly.
  const headerList = await headers();
  const cookieHeader = headerList.get("cookie") ?? "";
  const fakeRequest = new Request("http://internal/", {
    headers: { cookie: cookieHeader },
  });

  const session = await getSession(fakeRequest);
  if (!session) {
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

      <TaskList initialTasks={initialTasks} />
    </section>
  );
}
