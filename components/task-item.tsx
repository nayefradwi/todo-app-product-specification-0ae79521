"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { TaskCheckbox } from "@/components/task-checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/db/schema";

/**
 * TaskItem
 *
 * Renders a single task row: the optimistic-toggle <TaskCheckbox>, the
 * task title (struck-through when completed), and a trailing trash-icon
 * delete button.
 *
 * The checkbox's optimistic-toggle round-trip with the server is owned
 * entirely by <TaskCheckbox>. We mirror the displayed `completed` value
 * here via its `onCompletedChange` callback so the title's
 * `line-through` styling stays in sync — including after a revert on
 * failure.
 *
 * The delete button is intentionally a placeholder for this story — it
 * will be wired up in the dedicated "Delete Task" story.
 */
export type TaskItemProps = {
  task: Task;
};

export function TaskItem({ task }: TaskItemProps) {
  const [completed, setCompleted] = React.useState<boolean>(task.completed);

  // TODO(delete-task-story): wire this button up to DELETE /api/tasks/:id
  // and remove the task from TaskList state on success.
  function handleDelete() {
    // Intentionally empty placeholder — see TODO above.
  }

  const labelId = `task-${task.id}-completed`;

  return (
    <li
      className="flex items-center gap-3 px-4 py-3 text-sm"
      data-testid="task-item"
      data-task-id={task.id}
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
        aria-label={`Delete task "${task.title}"`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}

export default TaskItem;
