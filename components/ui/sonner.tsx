"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Toaster
 *
 * Thin wrapper around Sonner's `<Toaster />` so the rest of the app can
 * import a single canonical toaster from `@/components/ui/sonner`. Mount
 * this once at the root of the app (see `app/layout.tsx`); call
 * `toast(...)` from `sonner` anywhere in client code to surface a
 * notification.
 */
export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      richColors
      closeButton
      position="bottom-right"
      {...props}
    />
  );
}
