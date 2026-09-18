"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/notion/types";
import { formatDueRange, isOverdue, relativeDue } from "@/lib/utils/dates";
import { buildQuery, type SortKey, type TaskFilters } from "@/lib/utils/tasks";
import { Assignees } from "./assignees";
import { EmptyState } from "./empty-state";
import { OverdueTag, StatusBadge } from "./status-badge";
import { TaskDetailSheet } from "./task-detail-sheet";

const COLUMNS: Array<{ key: SortKey | null; label: string; className?: string }> =
  [
    { key: "name", label: "Tarea" },
    { key: "company", label: "Compañía" },
    { key: null, label: "Responsable" },
    { key: "due", label: "Plazo" },
    { key: "status", label: "Estado" },
    { key: null, label: "Acta origen" },
  ];

/**
 * El orden viaja en la URL igual que los filtros, así que ordenar también
 * produce un enlace compartible. Las cabeceras son enlaces, no botones con
 * estado de cliente.
 */
export function TableView({
  tasks,
  filters,
}: {
  tasks: Task[];
  filters: TaskFilters;
}) {
  const [selected, setSelected] = useState<Task | null>(null);

  if (tasks.length === 0) return <EmptyState />;

  return (
    <>
      {/* Escritorio: tabla. */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableHead key={column.label} className={column.className}>
                  {column.key ? (
                    <SortLink
                      column={column.key}
                      label={column.label}
                      filters={filters}
                    />
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const overdue = isOverdue(task.due, task.status === "Listo");
              return (
                <TableRow
                  key={task.id}
                  className={cn(
                    // Indicador de vencida: una barra sobria en el borde, no un
                    // fondo rojo. `tec §T1.2` no admite un quinto color.
                    overdue &&
                      "border-l-2 border-l-delta-navy bg-delta-navy/[0.03] dark:border-l-delta-lime dark:bg-delta-lime/[0.05]",
                  )}
                >
                  <TableCell className="max-w-xs">
                    <button
                      type="button"
                      onClick={() => setSelected(task)}
                      className="text-left font-medium underline-offset-4 hover:underline"
                    >
                      {task.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.companies.map((company) => company.name).join(", ") ||
                      "—"}
                  </TableCell>
                  <TableCell>
                    <Assignees people={task.assignees} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatDueRange(task.due)}</span>
                      {overdue ? <OverdueTag /> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} />
                  </TableCell>
                  <TableCell className="max-w-48">
                    <MeetingLinks task={task} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Móvil: la tabla se convierte en lista de tarjetas. */}
      <ul className="flex flex-col gap-2 md:hidden">
        {tasks.map((task) => {
          const overdue = isOverdue(task.due, task.status === "Listo");
          return (
            <li
              key={task.id}
              className={cn(
                "rounded-lg border bg-card p-3",
                overdue &&
                  "border-l-2 border-l-delta-navy dark:border-l-delta-lime",
              )}
            >
              <button
                type="button"
                onClick={() => setSelected(task)}
                className="text-left font-medium underline-offset-4 hover:underline"
              >
                {task.name}
              </button>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={task.status} />
                {overdue ? <OverdueTag /> : null}
                <span className="text-sm text-muted-foreground">
                  {task.due ? relativeDue(task.due) : "Sin plazo"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <Assignees people={task.assignees} />
                <span className="text-sm text-muted-foreground">
                  {task.companies.map((company) => company.name).join(", ")}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <TaskDetailSheet
        task={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}

function SortLink({
  column,
  label,
  filters,
}: {
  column: SortKey;
  label: string;
  filters: TaskFilters;
}) {
  const isActive = filters.sort === column;
  const nextDirection =
    isActive && filters.direction === "asc" ? "desc" : "asc";
  const Icon = !isActive ? ArrowUpDown : filters.direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <Link
      href={buildQuery(filters, { sort: column, dir: nextDirection })}
      scroll={false}
      aria-sort={
        isActive
          ? filters.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
    >
      {label}
      <Icon className="size-3.5 opacity-60" aria-hidden />
    </Link>
  );
}

function MeetingLinks({ task }: { task: Task }) {
  if (task.meetings.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {task.meetings.map((meeting) => (
        <a
          key={meeting.id}
          href={meeting.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 truncate text-sm underline underline-offset-4"
          title={meeting.title}
        >
          <span className="truncate">{meeting.title}</span>
          <ExternalLink className="size-3 shrink-0" aria-hidden />
        </a>
      ))}
    </div>
  );
}
