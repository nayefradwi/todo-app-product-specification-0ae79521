"use client";

import * as React from "react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";

/**
 * TaskCheckbox
 *
 * Self-contained client component that renders a shadcn `<Checkbox>` for
 * a single task and owns the optimistic-toggle round-trip with the
 * server. The component:
 *
 *   1. Seeds local `completed` state from `initialCompleted`.
 *   2. On user toggle, optimistically flips the local state immediately
 *      so the UI feels instantaneous.
 *   3. Fires `PATCH /api/tasks/{taskId}` with `{ completed }` and, on a
 *      non-2xx response or a network error, reverts the local state and
 *      surfaces a toast via `sonner`.
 *   4. Optionally notifies its parent via `onCompletedChange(next)` so
 *      surrounding markup (e.g. the task title's `line-through` styling)
 *      can react to the same value the checkbox displays.
 *
 * The component intentionally does NOT render the task title — that's
 * the parent task row's responsibility. Using the `onCompletedChange`
 * callback the parent can mirror this state and apply the
 * `line-through` Tailwind class when `completed` is true.
 */
export type TaskCheckboxProps = {
  /** UUID of the task this checkbox controls. */
  taskId: string;
  /** Server-rendered initial completion state. */
  initialCompleted: boolean;
  /**
   * Optional notification fired with the latest displayed `completed`
   * value, including after an optimistic flip and after a revert on
   * failure. Lets the parent row keep its own UI (title styling, etc.)
   * in sync with what this checkbox is currently rendering.
   */
  onCompletedChange?: (completed: boolean) => void;
  /** Optional aria-label override; defaults to a sensible task-aware label. */
  ariaLabel?: string;
  /** Optional pass-through className for the underlying Checkbox. */
  className?: string;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export function TaskCheckbox({
  taskId,
  initialCompleted,
  onCompletedChange,
  ariaLabel,
  className,
}: TaskCheckboxProps) {
  const [completed, setCompleted] = React.useState<boolean>(initialCompleted);
  const [pending, setPending] = React.useState<boolean>(false);

  // Keep parent in sync with whatever the checkbox is currently rendering,
  // including after a revert. Using a ref of the latest callback avoids
  // re-firing the effect when callers pass an inline arrow function.
  const onCompletedChangeRef = React.useRef(onCompletedChange);
  React.useEffect(() => {
    onCompletedChangeRef.current = onCompletedChange;
  }, [onCompletedChange]);

  React.useEffect(() => {
    onCompletedChangeRef.current?.(completed);
  }, [completed]);

  async function handleCheckedChange(nextRaw: boolean | "indeterminate") {
    if (pending) {
      return;
    }
    // Radix' Checkbox supports an "indeterminate" tri-state; we treat it
    // as "not completed" defensively, though our usage never sets it.
    const next = nextRaw === true;
    const previous = completed;
    if (next === previous) {
      return;
    }

    // 1. Optimistic flip.
    setCompleted(next);
    setPending(true);

    try {
      const response = await fetch(
        `/api/tasks/${encodeURIComponent(taskId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: next }),
        },
      );

      if (!response.ok) {
        // Try to surface a server-provided message; fall back to a generic
        // one so we never show an empty toast.
        let message = "Could not update task. Please try again.";
        try {
          const payload = (await response.json()) as ApiErrorPayload;
          if (payload && typeof payload === "object") {
            if (typeof payload.error === "string" && payload.error.length > 0) {
              message = payload.error;
            } else if (
              typeof payload.message === "string" &&
              payload.message.length > 0
            ) {
              message = payload.message;
            }
          }
        } catch {
          // Body wasn't JSON — keep the fallback message.
        }
        // 3a. Revert on error.
        setCompleted(previous);
        toast.error(message);
      }
    } catch {
      // 3b. Revert on network error.
      setCompleted(previous);
      toast.error("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Checkbox
      id={`task-${taskId}-completed`}
      checked={completed}
      disabled={pending}
      onCheckedChange={handleCheckedChange}
      aria-label={
        ariaLabel ??
        (completed ? "Mark task as not completed" : "Mark task as completed")
      }
      data-task-id={taskId}
      className={className}
    />
  );
}

export default TaskCheckbox;
