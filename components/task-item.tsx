"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { TaskCheckbox } from "@/components/task-checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/db/schema";

/**
 * TaskItem
 *
 * Renders a single task row in the task list: the optimistic-toggle
 * <TaskCheckbox>, the task title (struck-through when completed), and a
 * trailing trash-icon delete button. The row is laid out as a flex
 * container so the title fills available space between the fixed-width
 * checkbox and delete button.
 *
 * The checkbox's optimistic-toggle round-trip with the server is owned
 * entirely by <TaskCheckbox>. We mirror the displayed `completed` value
 * here via its `onCompletedChange` callback so the title's
 * `line-through` styling stays in sync with the checkbox — including
 * after a revert on failure. Persisted state on a page refresh is
 * sourced from the server-rendered `task.completed` prop.
 *
 * The delete button fires `DELETE /api/tasks/:id` and, on a 204
 * response, calls the parent-provided `onDelete(id)` callback so the
 * row can be removed from the list state. On any non-204 / network
 * failure we show a sonner toast and leave the row in place so the
 * user can retry. The button is hidden by default on `md+` viewports
 * and revealed on hover/focus of the row (the `group` class on the
 * `<li>` drives that), and stays always-visible on small screens
 * where there is no hover affordance.
 */
export type TaskItemProps = {
  task: Task;
  /**
   * Called with the task's `id` after a successful DELETE so the parent
   * can remove the row from its local list state. Optional — if omitted
   * the row simply stays put after a successful delete (useful for
   * isolated/storybook rendering).
   */
  onDelete?: (id: string) => void;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export function TaskItem({ task, onDelete }: TaskItemProps) {
  const [completed, setCompleted] = React.useState<boolean>(task.completed);
  const [deleting, setDeleting] = React.useState<boolean>(false);

  async function handleDelete() {
    if (deleting) {
      return;
    }
    setDeleting(true);

    try {
      const response = await fetch(
        `/api/tasks/${encodeURIComponent(task.id)}`,
        { method: "DELETE" },
      );

      if (response.status === 204) {
        // Notify parent so the row is removed from list state. We do this
        // before clearing `deleting` because `onDelete` will typically
        // unmount this component, after which a `setState` would warn.
        onDelete?.(task.id);
        return;
      }

      // Non-204 — try to surface a server-provided message; fall back to
      // a generic one so we never show an empty toast.
      let message = "Could not delete task. Please try again.";
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
      toast.error(message);
      setDeleting(false);
    } catch {
      toast.error("Network error. Please try again.");
      setDeleting(false);
    }
  }

  const labelId = `task-${task.id}-completed`;

  return (
    <li
      className={cn(
        "group flex items-center gap-3 px-4 py-3 text-sm transition-opacity",
        completed && "opacity-70",
        deleting && "opacity-50",
      )}
      data-testid="task-item"
      data-task-id={task.id}
      data-completed={completed ? "true" : "false"}
    >
      <TaskCheckbox
        taskId={task.id}
        initialCompleted={task.completed}
        onCompletedChange={setCompleted}
        ariaLabel={
          completed
            ? `Mark "${task.title}" as not completed`
            : `Mark "${task.title}" as completed`
        }
      />
      <label
        htmlFor={labelId}
        className={cn(
          "flex-1 cursor-pointer select-none break-words",
          completed && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete task"
        data-testid="delete-task-button"
        className={cn(
          "shrink-0 text-muted-foreground transition-opacity hover:text-destructive",
          // Always visible on mobile (no hover affordance), revealed on
          // hover / keyboard focus on md+ screens.
          "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:group-focus-within:opacity-100",
        )}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}

export default TaskItem;
