import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Todo App</h1>
      <p className="text-muted-foreground">Get started by signing in.</p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Register
        </Link>
      </div>
    </main>
  );
}
