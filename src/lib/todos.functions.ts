import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  ensureSchema,
  mapTodo,
  runSql,
  sqlLiteral,
  TODOS_TABLE,
  type Todo,
} from "./todos.server";

const SELECT_COLUMNS =
  "id, title, description, completed, priority, due_date, created_at, updated_at";

const todoInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export const listTodos = createServerFn({ method: "GET" }).handler(async (): Promise<Todo[]> => {
  await ensureSchema();
  const result = await runSql(
    `SELECT ${SELECT_COLUMNS} FROM ${TODOS_TABLE} ORDER BY completed ASC, id DESC`,
  );
  return result.rows.map(mapTodo);
});

export const createTodo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => todoInput.parse(data))
  .handler(async ({ data }): Promise<Todo> => {
    await ensureSchema();
    const result = await runSql(
      `INSERT INTO ${TODOS_TABLE} (title, description, priority, due_date)
       VALUES (${sqlLiteral(data.title)}, ${sqlLiteral(data.description?.length ? data.description : null)}, ${sqlLiteral(data.priority)}, ${sqlLiteral(data.due_date ?? null)})
       RETURNING ${SELECT_COLUMNS}`,
    );
    const row = result.rows[0];
    if (!row) throw new Error("Task could not be created");
    return mapTodo(row);
  });

export const updateTodo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => todoInput.extend({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ data }): Promise<Todo> => {
    await ensureSchema();
    const result = await runSql(
      `UPDATE ${TODOS_TABLE} SET
         title = ${sqlLiteral(data.title)},
         description = ${sqlLiteral(data.description?.length ? data.description : null)},
         priority = ${sqlLiteral(data.priority)},
         due_date = ${sqlLiteral(data.due_date ?? null)},
         updated_at = NOW()
       WHERE id = ${sqlLiteral(data.id)}
       RETURNING ${SELECT_COLUMNS}`,
    );
    const row = result.rows[0];
    if (!row) throw new Error("Task not found");
    return mapTodo(row);
  });

export const toggleTodo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ id: z.number().int().positive(), completed: z.boolean() }).parse(data),
  )
  .handler(async ({ data }): Promise<Todo> => {
    await ensureSchema();
    const result = await runSql(
      `UPDATE ${TODOS_TABLE} SET completed = ${sqlLiteral(data.completed)}, updated_at = NOW()
       WHERE id = ${sqlLiteral(data.id)} RETURNING ${SELECT_COLUMNS}`,
    );
    const row = result.rows[0];
    if (!row) throw new Error("Task not found");
    return mapTodo(row);
  });

export const deleteTodo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.number().int().positive() }).parse(data))
  .handler(async ({ data }): Promise<{ id: number }> => {
    await ensureSchema();
    await runSql(`DELETE FROM ${TODOS_TABLE} WHERE id = ${sqlLiteral(data.id)}`);
    return { id: data.id };
  });
