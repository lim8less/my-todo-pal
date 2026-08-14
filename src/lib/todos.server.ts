const BASE_URL = "https://professed-endurance-agent.ngrok-free.dev/api/v1";
const PROJECT_ID = 13;
const TABLE = "todos";

export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface QueryResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
}

export function sqlLiteral(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Invalid number");
    return String(value);
  }
  return `'${value.replace(/'/g, "''")}'`;
}

async function platformFetch(path: string, body: unknown): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
    },
    body: JSON.stringify(body),
  });
}

async function readError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return parsed.error?.message ?? text.slice(0, 200);
  } catch {
    return text.slice(0, 200);
  }
}

export async function runSql(sql: string): Promise<QueryResponse> {
  const res = await platformFetch(`/projects/${PROJECT_ID}/query`, { sql });
  if (!res.ok) throw new Error(`Database request failed: ${await readError(res)}`);
  return (await res.json()) as QueryResponse;
}

export async function ensureSchema(): Promise<void> {
  const ddl = `CREATE TABLE IF NOT EXISTS ${TABLE} (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  const res = await platformFetch(`/projects/${PROJECT_ID}/schema/apply`, { sql: ddl });
  if (!res.ok) throw new Error(`Schema initialization failed: ${await readError(res)}`);
}

function normalizePriority(value: unknown): Priority {
  return value === "low" || value === "high" ? value : "medium";
}

function toDateString(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value.slice(0, 10);
}

export function mapTodo(row: Record<string, unknown>): Todo {
  return {
    id: Number(row["id"]),
    title: String(row["title"] ?? ""),
    description: row["description"] == null ? null : String(row["description"]),
    completed: row["completed"] === true || row["completed"] === "true",
    priority: normalizePriority(row["priority"]),
    due_date: toDateString(row["due_date"]),
    created_at: String(row["created_at"] ?? ""),
    updated_at: String(row["updated_at"] ?? ""),
  };
}

export const TODOS_TABLE = TABLE;
