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
 * Toggle-completed and delete interactions are intentionally out of
 * scope for this story — they will be wired up in their own follow-up
 * stories and will hook into the same `setTasks` reducer pattern used
 * here for the add path.
 */
export type TaskListClientProps = {
  initialTasks: Task[];
};

export function TaskListClient({ initialTasks }: TaskListClientProps) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);

  const handleTaskAdded = React.useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  return (
    <div className="flex flex-col gap-4" data-testid="task-list-root">
      <AddTaskForm onTaskAdded={handleTaskAdded} />
      <TaskList tasks={tasks} />
    </div>
  );
}

export default TaskListClient;
