"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/notion/types";
import { isOverdue, relativeDue } from "@/lib/utils/dates";
import { Assignees } from "./assignees";
import { EmptyState } from "./empty-state";
import { OverdueTag } from "./status-badge";
import { TaskDetailSheet } from "./task-detail-sheet";

/**
 * Tres columnas fijas, siempre las mismas aunque estén vacías: el tablero tiene
 * que leerse igual cada día. Sin arrastrar tarjetas, porque la app no escribe
 * en Notion y una tarjeta que se mueve y no se guarda es una mentira.
 */
export function KanbanView({ tasks }: { tasks: Task[] }) {
  const [selected, setSelected] = useState<Task | null>(null);

  if (tasks.length === 0) return <EmptyState />;

  const columns = TASK_STATUSES.map((status) => ({
    status,
    items: tasks.filter((task) => task.status === status),
  }));
  const unassigned = tasks.filter((task) => task.status === null);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {columns.map((column) => (
          <Column
            key={column.status}
            title={column.status}
            tasks={column.items}
            onSelect={setSelected}
          />
        ))}
        {unassigned.length > 0 ? (
          <Column
            title="Sin estado"
            tasks={unassigned}
            onSelect={setSelected}
            className="md:col-span-3"
          />
        ) : null}
      </div>

      <TaskDetailSheet
        task={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}

function Column({
  title,
  tasks,
  onSelect,
  className,
}: {
  title: TaskStatus | "Sin estado";
  tasks: Task[];
  onSelect: (task: Task) => void;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-2 rounded-lg bg-muted/60 p-2", className)}>
      <header className="flex items-center justify-between px-1 py-1">
        <h2 className="delta-eyebrow text-muted-foreground">{title}</h2>
        <Badge variant="outline" className="tabular-nums">
          {tasks.length}
        </Badge>
      </header>

      {tasks.length === 0 ? (
        <p className="px-1 pb-2 text-sm text-muted-foreground">
          Nada en esta columna.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskCard({
  task,
  onSelect,
}: {
  task: Task;
  onSelect: (task: Task) => void;
}) {
  const overdue = isOverdue(task.due, task.status === "Listo");

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className={cn(
        "w-full rounded-md border bg-card p-3 text-left transition-colors hover:bg-muted",
        overdue && "border-l-2 border-l-delta-navy dark:border-l-delta-lime",
      )}
    >
      <p className="font-medium text-pretty">{task.name}</p>

      {task.companies.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.companies.map((company) => (
            <Badge key={company.id} variant="outline">
              {company.name}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <Assignees people={task.assignees} showNames={false} />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {overdue ? <OverdueTag /> : null}
          {task.due ? relativeDue(task.due) : "Sin plazo"}
        </span>
      </div>
    </button>
  );
}
