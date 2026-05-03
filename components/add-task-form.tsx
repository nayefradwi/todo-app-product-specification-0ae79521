"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * AddTaskForm (placeholder)
 *
 * Visual shell for the "add a task" form. Submitting is intentionally a
 * no-op for now — the real implementation (POST /api/tasks + optimistic
 * insert) ships in a follow-up task. Keeping the markup and `"use client"`
 * boundary in place so the parent server component can render it today
 * and the wiring lands later without restructuring.
 */
export function AddTaskForm() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // No-op placeholder: real submit handler is built in a later task.
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
          disabled
        />
      </div>
      <Button type="submit" disabled>
        Add
      </Button>
    </form>
  );
}

export default AddTaskForm;
