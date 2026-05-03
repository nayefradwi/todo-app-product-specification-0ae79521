"use client";

import * as React from "react";

import { AddTaskForm } from "@/components/add-task-form";
import { TaskList } from "@/components/task-list";
import type { Task } from "@/lib/db/schema";

/**
 * TaskListClient
 *
 * Client-side orchestrator for the task list page. Seeds its task state
 * from the server-rendered `initialTasks` prop and composes the two
 * presentational pieces of the page:
 *
 *   1. `<AddTaskForm>` — handles the POST /api/tasks round-trip itself
 *      and fires `onTaskAdded(task)` with the server-returned row.
 *   2. `<TaskList>` — renders the current `tasks` array as an ordered
 *      list of rows (or an empty-state placeholder when empty).
 *
 * Lifting state up here keeps `<TaskList>` purely presentational while
 * still letting newly-added tasks appear instantly without a full page
 * reload. New tasks are appended at the bottom to mirror the server-side
 * `ORDER BY created_at ASC` ordering.
 *
 * The toggle-completed flow is owned end-to-end by `<TaskCheckbox>`
 * inside each row (it speaks to PATCH /api/tasks/{id} directly with an
 * optimistic UI), so no callback is needed here for that path. The
 * delete flow does need to flow back up: each `<TaskItem>` calls
 * `onDelete(id)` after a successful DELETE round-trip, and we drop the
 * row from `tasks` here so the list re-renders without it.
 */
export type TaskListClientProps = {
  initialTasks: Task[];
};

export function TaskListClient({ initialTasks }: TaskListClientProps) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);

  const handleTaskAdded = React.useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  const handleTaskDeleted = React.useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  return (
    <div className="flex flex-col gap-4" data-testid="task-list-root">
      <AddTaskForm onTaskAdded={handleTaskAdded} />
      <TaskList tasks={tasks} onDelete={handleTaskDeleted} />
    </div>
  );
}

export default TaskListClient;
