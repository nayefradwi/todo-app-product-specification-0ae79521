"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/**
 * LogoutButton
 *
 * Client component that ends the current session by POSTing to
 * `/api/auth/logout` (which clears the session cookie) and then redirects
 * the user to `/login`.
 *
 * While the request is in flight the button is disabled to prevent
 * double-submission and shows a brief "Logging out..." label.
 */
export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Even if the network request fails we still want to send the user
      // to /login — their cookie is HttpOnly so they can't clear it client
      // side, but the redirect at least removes them from authed surfaces.
    } finally {
      router.push("/login");
      // Refresh so any server components re-evaluate their auth state.
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}

export default LogoutButton;
