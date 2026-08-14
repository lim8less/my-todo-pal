import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Priority, Todo } from "@/lib/todos.server";

const priorityStyles: Record<Priority, string> = {
  low: "bg-priority-low/12 text-priority-low",
  medium: "bg-priority-medium/15 text-priority-medium",
  high: "bg-priority-high/12 text-priority-high",
};

function formatDue(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(value: string): boolean {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return value < todayKey;
}

interface TaskItemProps {
  todo: Todo;
  busy?: boolean;
  onToggle: (todo: Todo) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export function TaskItem({ todo, busy, onToggle, onEdit, onDelete }: TaskItemProps) {
  return (
    <li
      className={cn(
        "group card-surface flex items-start gap-3 p-4 transition-all sm:gap-4 sm:p-5",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        busy && "opacity-60",
        todo.completed && "bg-surface",
      )}
    >
      <Checkbox
        checked={todo.completed}
        disabled={busy}
        onCheckedChange={() => onToggle(todo)}
        aria-label={todo.completed ? "Mark as active" : "Mark as completed"}
        className="mt-1 size-5"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={cn(
              "text-display min-w-0 break-words text-base font-semibold",
              todo.completed && "text-muted-foreground line-through",
            )}
          >
            {todo.title}
          </h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              priorityStyles[todo.priority],
            )}
          >
            {todo.priority}
          </span>
        </div>

        {todo.description ? (
          <p
            className={cn(
              "mt-1.5 break-words text-sm text-muted-foreground",
              todo.completed && "line-through",
            )}
          >
            {todo.description}
          </p>
        ) : null}

        {todo.due_date ? (
          <p
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
              !todo.completed && isOverdue(todo.due_date) && "text-destructive",
            )}
          >
            <CalendarDays className="size-3.5" />
            {formatDue(todo.due_date)}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${todo.title}`}
          disabled={busy}
          onClick={() => onEdit(todo)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${todo.title}`}
          disabled={busy}
          onClick={() => onDelete(todo)}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
