import type { Task, TaskStatus } from "@/lib/notion/types";
import { TASK_STATUSES } from "@/lib/notion/types";
import { isOverdue, isThisWeek, toDate } from "./dates";

/**
 * Filtrado, orden y KPIs. Todo son funciones puras sobre `Task[]`: el filtrado
 * ocurre en el servidor, dentro del Server Component, y el cliente solo escribe
 * los search params.
 */

export const VIEWS = ["table", "kanban", "calendar"] as const;
export type ViewKey = (typeof VIEWS)[number];

export const SORT_KEYS = ["due", "name", "company", "status"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type SortDirection = "asc" | "desc";

export interface TaskFilters {
  view: ViewKey;
  companies: string[];
  assignees: string[];
  statuses: TaskStatus[];
  query: string;
  sort: SortKey;
  direction: SortDirection;
  month: string | undefined;
}

export type SearchParams = Record<string, string | string[] | undefined>;

function readList(params: SearchParams, key: string): string[] {
  const raw = params[key];
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function readOne(params: SearchParams, key: string): string | undefined {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || undefined;
}

export function parseFilters(params: SearchParams): TaskFilters {
  const view = readOne(params, "view");
  const sort = readOne(params, "sort");
  const direction = readOne(params, "dir");
  const statuses = readList(params, "status").filter(
    (value): value is TaskStatus =>
      (TASK_STATUSES as readonly string[]).includes(value),
  );

  return {
    view: VIEWS.includes(view as ViewKey) ? (view as ViewKey) : "table",
    companies: readList(params, "company"),
    assignees: readList(params, "assignee"),
    statuses,
    query: readOne(params, "q") ?? "",
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "due",
    direction: direction === "desc" ? "desc" : "asc",
    month: readOne(params, "month"),
  };
}

/** `true` cuando hay algo que "Limpiar filtros" pueda limpiar. */
export function hasActiveFilters(filters: TaskFilters): boolean {
  return (
    filters.companies.length > 0 ||
    filters.assignees.length > 0 ||
    filters.statuses.length > 0 ||
    filters.query.length > 0
  );
}

/** Comparación insensible a mayúsculas y a tildes, que es como busca la gente. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = normalize(filters.query);

  return tasks.filter((task) => {
    if (
      filters.companies.length > 0 &&
      !task.companies.some((company) => filters.companies.includes(company.id))
    ) {
      return false;
    }
    if (
      filters.assignees.length > 0 &&
      !task.assignees.some((person) => filters.assignees.includes(person.id))
    ) {
      return false;
    }
    if (
      filters.statuses.length > 0 &&
      (task.status === null || !filters.statuses.includes(task.status))
    ) {
      return false;
    }
    if (query && !normalize(task.name).includes(query)) return false;
    return true;
  });
}

const collator = new Intl.Collator("es", { sensitivity: "base" });

/** Orden de las columnas del kanban, para ordenar por estado con sentido. */
const statusRank: Record<TaskStatus, number> = {
  "Sin empezar": 0,
  "En progreso": 1,
  Listo: 2,
};

export function sortTasks(
  tasks: Task[],
  sort: SortKey,
  direction: SortDirection,
): Task[] {
  const factor = direction === "desc" ? -1 : 1;

  return [...tasks].sort((a, b) => {
    switch (sort) {
      case "name":
        return factor * collator.compare(a.name, b.name);
      case "company":
        return (
          factor *
          collator.compare(
            a.companies[0]?.name ?? "",
            b.companies[0]?.name ?? "",
          )
        );
      case "status":
        return (
          factor *
          ((a.status ? statusRank[a.status] : 99) -
            (b.status ? statusRank[b.status] : 99))
        );
      case "due":
      default: {
        // Las tareas sin plazo van siempre al final, ordene como ordene.
        if (!a.due && !b.due) return collator.compare(a.name, b.name);
        if (!a.due) return 1;
        if (!b.due) return -1;
        return (
          factor *
          (toDate(a.due.start).getTime() - toDate(b.due.start).getTime())
        );
      }
    }
  });
}

export interface TaskKpis {
  open: number;
  overdue: number;
  dueThisWeek: number;
  done: number;
}

/** Se calculan sobre las tareas ya filtradas: los KPIs siguen a la vista. */
export function computeKpis(tasks: Task[]): TaskKpis {
  let open = 0;
  let overdue = 0;
  let dueThisWeek = 0;
  let done = 0;

  for (const task of tasks) {
    const isDone = task.status === "Listo";
    if (isDone) done += 1;
    else open += 1;
    if (isOverdue(task.due, isDone)) overdue += 1;
    if (!isDone && isThisWeek(task.due)) dueThisWeek += 1;
  }

  return { open, overdue, dueThisWeek, done };
}

/** Iniciales para cuando Notion no expone el avatar del usuario. */
export function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Serializa los filtros actuales a query string, aplicando un parche encima. */
export function buildQuery(
  filters: TaskFilters,
  patch: Partial<Record<string, string | string[] | undefined>> = {},
): string {
  const base: Record<string, string | string[] | undefined> = {
    view: filters.view,
    company: filters.companies,
    assignee: filters.assignees,
    status: filters.statuses,
    q: filters.query || undefined,
    sort: filters.sort === "due" ? undefined : filters.sort,
    dir: filters.direction === "asc" ? undefined : filters.direction,
    month: filters.month,
  };

  const merged = { ...base, ...patch };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
