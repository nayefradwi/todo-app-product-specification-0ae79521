import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";

/**
 * Layout for the authenticated section of the app.
 *
 * Renders a top header containing the app title (linked back to the task
 * list) and a `<LogoutButton />` in the top-right so the logout control
 * appears on every protected page.
 *
 * Auth gating itself is handled by middleware / server-side session checks
 * elsewhere — this layout only owns the chrome.
 */
export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight hover:opacity-80"
          >
            Todo App
          </Link>
          <div className="flex items-center gap-2">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
