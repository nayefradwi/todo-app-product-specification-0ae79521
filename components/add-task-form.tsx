"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Task } from "@/lib/db/schema";

/**
 * AddTaskForm
 *
 * Client Component that POSTs a new task to `/api/tasks` and hands the
 * resulting server-created `Task` back to the parent (`<TaskList>`) via
 * the `onTaskAdded` callback so the row can be appended to the list
 * without a full page reload.
 *
 * Behavior:
 *   - Submitting either by clicking the Add button or pressing Enter in
 *     the input triggers the same handler.
 *   - The trimmed title must be non-empty; empty submissions are ignored
 *     client-side without hitting the network.
 *   - While the request is in flight, the input and button are disabled
 *     and the button label flips to "Adding…".
 *   - On 201 the input is cleared and `onTaskAdded(task)` is fired.
 *   - On any non-2xx response (or network failure) an inline error
 *     message is rendered below the form and the input is preserved so
 *     the user can retry without retyping.
 */
export type AddTaskFormProps = {
  /** Called with the freshly-created task after a successful POST. */
  onTaskAdded: (task: Task) => void;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export function AddTaskForm({ onTaskAdded }: AddTaskFormProps) {
  const [title, setTitle] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });

      if (response.status !== 201) {
        // Try to surface a human-readable message from the API; fall back
        // to a generic one so we never render an empty error.
        let message = "Could not add task. Please try again.";
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
        setError(message);
        return;
      }

      const created = (await response.json()) as Omit<Task, "createdAt"> & {
        createdAt: string | Date;
      };
      // The server returns `createdAt` as an ISO string over JSON; rehydrate
      // it into a Date so the shape matches `Task` for downstream consumers
      // (e.g. anything that formats the timestamp).
      const newTask: Task = {
        ...created,
        createdAt:
          created.createdAt instanceof Date
            ? created.createdAt
            : new Date(created.createdAt),
      };

      onTaskAdded(newTask);
      setTitle("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const trimmedEmpty = title.trim().length === 0;

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-row items-center gap-2"
        aria-label="Add a new task"
      >
        <Input
          id="new-task-title"
          name="title"
          type="text"
          placeholder="What needs to be done?"
          autoComplete="off"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={submitting}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "add-task-error" : undefined}
          className="flex-1"
        />
        <Button type="submit" disabled={submitting || trimmedEmpty}>
          {submitting ? "Adding…" : "Add"}
        </Button>
      </form>
      {error ? (
        <p
          id="add-task-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default AddTaskForm;
