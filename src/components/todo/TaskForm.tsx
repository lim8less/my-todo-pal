import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Priority, Todo } from "@/lib/todos.server";

export interface TaskFormValues {
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
}

interface TaskFormProps {
  mode: "create" | "edit";
  initial?: Todo;
  pending?: boolean;
  onSubmit: (values: TaskFormValues) => void;
  onCancel?: () => void;
}

export function TaskForm({ mode, initial, pending, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setPriority(initial?.priority ?? "medium");
    setDueDate(initial?.due_date ?? "");
  }, [initial]);

  const canSubmit = title.trim().length > 0 && !pending;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          priority,
          due_date: dueDate ? dueDate : null,
        });
        if (mode === "create") {
          setTitle("");
          setDescription("");
          setPriority("medium");
          setDueDate("");
        }
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor={`${mode}-title`}>Task</Label>
        <Input
          id={`${mode}-title`}
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to get done?"
          className="h-11 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-description`}>Details</Label>
        <Textarea
          id={`${mode}-description`}
          value={description}
          maxLength={2000}
          rows={3}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional notes, links or context"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-priority`}>Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
            <SelectTrigger id={`${mode}-priority`} className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-due`}>Due date</Label>
          <Input
            id={`${mode}-due`}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!canSubmit} className="h-11 flex-1 sm:flex-none">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : mode === "create" ? (
            <Plus className="size-4" />
          ) : null}
          {mode === "create" ? "Add task" : "Save changes"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" className="h-11" onClick={onCancel}>
            <X className="size-4" />
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
