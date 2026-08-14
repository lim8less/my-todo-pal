import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, ListTodo, Loader2, Search, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TaskForm, type TaskFormValues } from "@/components/todo/TaskForm";
import { TaskItem } from "@/components/todo/TaskItem";
import type { Priority, Todo } from "@/lib/todos.server";
import {
  createTodo,
  deleteTodo,
  listTodos,
  toggleTodo,
  updateTodo,
} from "@/lib/todos.functions";

const title = "Todo Manager — Plan, track and finish your tasks";
const description =
  "Todo Manager keeps your work in one place: create, edit and prioritise tasks, set due dates, search instantly and check things off.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TodoManagerPage,
});

type StatusFilter = "all" | "active" | "completed";
type PriorityFilter = "all" | Priority;

function TodoManagerPage() {
  const queryClient = useQueryClient();
  const fetchTodos = useServerFn(listTodos);
  const create = useServerFn(createTodo);
  const update = useServerFn(updateTodo);
  const toggle = useServerFn(toggleTodo);
  const remove = useServerFn(deleteTodo);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [editing, setEditing] = useState<Todo | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const todosQuery = useQuery({
    queryKey: ["todos"],
    queryFn: () => fetchTodos(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["todos"] });
  const fail = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : "Something went wrong");

  const createMutation = useMutation({
    mutationFn: (values: TaskFormValues) => create({ data: values }),
    onSuccess: async () => {
      toast.success("Task added");
      await invalidate();
    },
    onError: fail,
  });

  const updateMutation = useMutation({
    mutationFn: (values: TaskFormValues & { id: number }) => update({ data: values }),
    onSuccess: async () => {
      toast.success("Task updated");
      setEditing(null);
      await invalidate();
    },
    onError: fail,
  });

  const toggleMutation = useMutation({
    mutationFn: (todo: Todo) => toggle({ data: { id: todo.id, completed: !todo.completed } }),
    onMutate: (todo) => setBusyId(todo.id),
    onSuccess: async () => {
      await invalidate();
    },
    onError: fail,
    onSettled: () => setBusyId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (todo: Todo) => remove({ data: { id: todo.id } }),
    onSuccess: async () => {
      toast.success("Task deleted");
      await invalidate();
    },
    onError: fail,
    onSettled: () => setPendingDelete(null),
  });

  const todos = todosQuery.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return todos.filter((todo) => {
      if (status === "active" && todo.completed) return false;
      if (status === "completed" && !todo.completed) return false;
      if (priority !== "all" && todo.priority !== priority) return false;
      if (!term) return true;
      return (
        todo.title.toLowerCase().includes(term) ||
        (todo.description ?? "").toLowerCase().includes(term)
      );
    });
  }, [todos, search, status, priority]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;

  const statusTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: todos.length },
    { value: "active", label: "Active", count: activeCount },
    { value: "completed", label: "Done", count: completedCount },
  ];

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
              <ListTodo className="size-3.5" />
              Todo Manager
            </p>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Everything you need to get done.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Capture tasks, set priorities and due dates, then work through them one check at a
              time.
            </p>
          </div>
          <div className="card-surface px-4 py-3 text-right">
            <p className="text-display text-2xl font-bold">
              {completedCount}
              <span className="text-muted-foreground">/{todos.length}</span>
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Completed
            </p>
          </div>
        </header>

        <section aria-label="Add a task" className="card-surface mt-8 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">New task</h2>
          <div className="mt-4">
            <TaskForm
              mode="create"
              pending={createMutation.isPending}
              onSubmit={(values) => createMutation.mutate(values)}
            />
          </div>
        </section>

        <section aria-label="Your tasks" className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks"
                aria-label="Search tasks"
                className="h-11 pl-9"
              />
            </div>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as PriorityFilter)}
            >
              <SelectTrigger className="h-11 sm:w-44" aria-label="Filter by priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">High priority</SelectItem>
                <SelectItem value="medium">Medium priority</SelectItem>
                <SelectItem value="low">Low priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => setStatus(tab.value)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  status === tab.value
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {tab.label}
                <span className="ml-1.5 opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-6">
            {todosQuery.isPending ? (
              <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading your tasks…
              </p>
            ) : todosQuery.isError ? (
              <div className="card-surface flex flex-col items-center gap-3 py-12 text-center">
                <TriangleAlert className="size-6 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  We couldn't reach the database right now.
                </p>
                <Button variant="outline" onClick={() => todosQuery.refetch()}>
                  Try again
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="card-surface flex flex-col items-center gap-2 py-14 text-center">
                <CheckCircle2 className="size-6 text-primary" />
                <p className="text-display font-semibold">
                  {todos.length === 0 ? "No tasks yet" : "Nothing matches those filters"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {todos.length === 0
                    ? "Add your first task above and it will show up here."
                    : "Try a different search term, status or priority."}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.map((todo) => (
                  <TaskItem
                    key={todo.id}
                    todo={todo}
                    busy={busyId === todo.id}
                    onToggle={(item) => toggleMutation.mutate(item)}
                    onEdit={setEditing}
                    onDelete={setPendingDelete}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update the details and save your changes.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <TaskForm
              mode="edit"
              initial={editing}
              pending={updateMutation.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(values) => updateMutation.mutate({ ...values, id: editing.id })}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.title}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
