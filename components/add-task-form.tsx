"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Task } from "@/lib/db/schema";

/**
 * AddTaskForm
 *
 * Controlled form for creating a new task. The actual POST /api/tasks
 * round-trip ships in a dedicated follow-up story; for the purposes of
 * the "Build TaskList and TaskItem components" story, submitting the
 * form synthesizes a client-side `Task`-shaped object and hands it to
 * the parent `<TaskList>` via `onAddTask` so the new row appears at the
 * bottom of the list immediately, without a full page reload.
 *
 * When the API wiring lands, this component will swap the local task
 * synthesis for a `fetch("/api/tasks", { method: "POST" })` call and
 * pass the server-returned task into `onAddTask` instead.
 */
export type AddTaskFormProps = {
  /** Called with a freshly-created task after a successful submit. */
  onAddTask: (task: Task) => void;
};

export function AddTaskForm({ onAddTask }: AddTaskFormProps) {
  const [title, setTitle] = React.useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return;
    }

    // Local-only task synthesis. Replaced by a POST /api/tasks call in a
    // follow-up story — the shape returned to `onAddTask` will be the
    // same, so TaskList does not need to change.
    const newTask: Task = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `local-${Date.now()}`,
      // `userId` is unknown on the client; the server will populate it
      // once the API wiring lands. Empty string keeps the type honest
      // without leaking a misleading id.
      userId: "",
      title: trimmed,
      completed: false,
      createdAt: new Date(),
    };

    onAddTask(newTask);
    setTitle("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      aria-label="Add a new task"
    >
      <div className="flex-1 space-y-1">
        <Label htmlFor="new-task-title">New task</Label>
        <Input
          id="new-task-title"
          name="title"
          type="text"
          placeholder="What needs to be done?"
          autoComplete="off"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={title.trim().length === 0}>
        Add
      </Button>
    </form>
  );
}

export default AddTaskForm;
