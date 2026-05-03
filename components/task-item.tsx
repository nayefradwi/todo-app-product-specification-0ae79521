"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/db/schema";

/**
 * TaskItem
 *
 * Renders a single task row: a checkbox showing the completion state, the
 * task title (struck-through when completed), and a trailing trash-icon
 * delete button.
 *
 * The interactive handlers for the checkbox and delete button are
 * intentionally placeholders for this story — they will be wired up in
 * the dedicated "Mark Complete" and "Delete Task" stories. The markup is
 * shipped now so that the surrounding list/state plumbing can be built
 * and reviewed independently.
 */
export type TaskItemProps = {
  task: Task;
};

export function TaskItem({ task }: TaskItemProps) {
  // TODO(mark-complete-story): wire this checkbox up to PATCH /api/tasks/:id
  // toggling `completed`, with optimistic update via the parent TaskList.
  function handleToggle(_event: React.ChangeEvent<HTMLInputElement>) {
    // Intentionally empty placeholder — see TODO above.
  }

  // TODO(delete-task-story): wire this button up to DELETE /api/tasks/:id
  // and remove the task from TaskList state on success.
  function handleDelete() {
    // Intentionally empty placeholder — see TODO above.
  }

  const checkboxId = `task-${task.id}-completed`;

  return (
    <li
      className="flex items-center gap-3 px-4 py-3 text-sm"
      data-testid="task-item"
      data-task-id={task.id}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
        // `readOnly` would suppress React's controlled-without-handler warning,
        // but we want a real onChange in place for the follow-up story to
        // hook into without restructuring this component.
        className="h-4 w-4 cursor-pointer rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={
          task.completed
            ? `Mark "${task.title}" as not completed`
            : `Mark "${task.title}" as completed`
        }
      />
      <label
        htmlFor={checkboxId}
        className={cn(
          "flex-1 cursor-pointer select-none break-words",
          task.completed && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        aria-label={`Delete task "${task.title}"`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}

export default TaskItem;
