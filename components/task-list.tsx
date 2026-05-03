import * as React from "react";

import { TaskItem } from "@/components/task-item";
import type { Task } from "@/lib/db/schema";

/**
 * TaskList
 *
 * Presentation-only component that renders an ordered list of
 * `<TaskItem>` rows for the supplied `tasks` array, or a friendly empty
 * state if the list is empty.
 *
 * Task state itself is owned by the parent `<TaskListClient>` wrapper —
 * keeping this component stateless makes it trivially reusable and easy
 * to snapshot-test. Mutations (add / toggle-complete / delete) are wired
 * up at the client wrapper level and flow back into this component via
 * the `tasks` prop.
 */
export type TaskListProps = {
  tasks: Task[];
};

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
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
    <ol className="divide-y rounded-md border bg-card" data-testid="task-list">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ol>
  );
}

export default TaskList;
