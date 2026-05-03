/**
 * Task list page (`/tasks`).
 *
 * Minimal placeholder so the protected layout has a concrete route to
 * render; the real task list UI (CRUD form, filters, etc.) is being
 * built in subsequent tasks. The `<LogoutButton />` lives in the
 * surrounding `(protected)/layout.tsx` and so already appears in the
 * top-right of this page's header.
 */
export default function TasksPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Your tasks</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;re signed in. Task management UI coming soon.
        </p>
      </div>
    </section>
  );
}
