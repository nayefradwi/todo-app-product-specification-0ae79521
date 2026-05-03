"use client";

import * as React from "react";

import { AddTaskForm } from "@/components/add-task-form";
import { TaskItem } from "@/components/task-item";
import type { Task } from "@/lib/db/schema";

/**
 * TaskList
 *
 * Client Component that owns the in-page task collection. It seeds its
 * state from the `initialTasks` prop (fetched server-side in the parent
 * RSC) and renders an ordered list of `<TaskItem>` rows.
 *
 * State is intentionally lifted up to this component so that the sibling
 * `<AddTaskForm>` can append a newly created task to the rendered list
 * without a full page reload. The form is rendered as a child of this
 * component and receives an `onAddTask` callback; submitting the form
 * appends the new task to the bottom of the list.
 *
 * Toggle-completed and delete interactions are intentionally placeholders
 * on `<TaskItem>` for this story and will be wired up in the dedicated
 * follow-up stories.
 */
export type TaskListProps = {
  initialTasks: Task[];
};

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);

  /**
   * Append a freshly-created task to the end of the visible list. The
   * actual POST /api/tasks call is performed inside `<AddTaskForm>` in a
   * follow-up story; for now we accept a `Task`-shaped object and simply
   * push it into local state. New tasks always land at the bottom to
   * mirror the server-side `ORDER BY created_at ASC` ordering.
   */
  const handleAddTask = React.useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  return (
    <div className="flex flex-col gap-4" data-testid="task-list-root">
      <AddTaskForm onAddTask={handleAddTask} />

      {tasks.length === 0 ? (
        <div
          className="rounded-md border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
          data-testid="task-list-empty"
        >
          No tasks yet — add your first one above.
        </div>
      ) : (
        <ol
          className="divide-y rounded-md border bg-card"
          data-testid="task-list"
        >
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ol>
      )}
    </div>
  );
}

export default TaskList;
