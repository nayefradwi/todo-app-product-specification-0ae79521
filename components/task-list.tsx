"use client";

import * as React from "react";

import type { Task } from "@/lib/db/schema";

/**
 * TaskList (placeholder)
 *
 * Receives the user's tasks fetched server-side and renders them in a
 * minimal list. This is a placeholder — interactivity (toggle complete,
 * delete, edit) will be wired up in subsequent tasks. The component is
 * marked `"use client"` so the eventual stateful version can be a drop-in
 * replacement without changing the parent server component's import.
 */
export type TaskListProps = {
  initialTasks: Task[];
};

export function TaskList({ initialTasks }: TaskListProps) {
  if (initialTasks.length === 0) {
    return (
      <div
        className="rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
        data-testid="task-list-empty"
      >
        No tasks yet — add your first one above.
      </div>
    );
  }

  return (
    <ul
      className="divide-y rounded-md border bg-card"
      data-testid="task-list"
    >
      {initialTasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center gap-3 px-4 py-3 text-sm"
        >
          <span
            aria-hidden
            className={
              task.completed
                ? "inline-block h-4 w-4 rounded-sm border bg-primary"
                : "inline-block h-4 w-4 rounded-sm border"
            }
          />
          <span
            className={
              task.completed
                ? "flex-1 text-muted-foreground line-through"
                : "flex-1"
            }
          >
            {task.title}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default TaskList;
