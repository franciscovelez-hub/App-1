"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/notion/types";
import {
  dayKey,
  daysCovered,
  formatLongDate,
  isOverdue,
  isSameMonth,
  isToday,
  monthGrid,
  monthLabel,
  monthParam,
  parseMonthParam,
  shiftMonthParam,
  startOfMonth,
  WEEKDAY_LABELS,
} from "@/lib/utils/dates";
import { buildQuery, type TaskFilters } from "@/lib/utils/tasks";
import { EmptyState } from "./empty-state";
import { TaskDetailSheet } from "./task-detail-sheet";

/**
 * Calendario mensual hecho a mano con CSS grid y `date-fns`. Nada de librerías
 * de calendario: pesan más que todo lo que hay en esta pantalla junta
 * (`tec §T5`) y no hacen falta para pintar una rejilla de 7 columnas.
 *
 * El mes visible vive en `?month=yyyy-MM`, así que se comparte igual que los
 * filtros y la navegación son enlaces, no estado de cliente.
 */

interface DayEntry {
  task: Task;
  /** `false` cuando el día es continuación de un plazo que empezó antes. */
  isStart: boolean;
}

export function CalendarView({
  tasks,
  filters,
}: {
  tasks: Task[];
  filters: TaskFilters;
}) {
  const [selected, setSelected] = useState<Task | null>(null);

  const month = parseMonthParam(filters.month);
  const days = monthGrid(month);

  // Índice día → tareas. Una tarea con rango aparece en cada día que ocupa.
  const byDay = new Map<string, DayEntry[]>();
  for (const task of tasks) {
    if (!task.due) continue;
    const covered = daysCovered(task.due);
    covered.forEach((day, index) => {
      const key = dayKey(day);
      const entries = byDay.get(key) ?? [];
      entries.push({ task, isStart: index === 0 });
      byDay.set(key, entries);
    });
  }

  const visibleDays = days.filter((day) => byDay.has(dayKey(day)));
  const currentMonthParam = monthParam(startOfMonth(new Date()));

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold first-letter:uppercase">
          {monthLabel(month)}
        </h2>
        <nav className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link
              href={buildQuery(filters, { month: shiftMonthParam(month, -1) })}
              scroll={false}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link
              href={buildQuery(filters, { month: currentMonthParam })}
              scroll={false}
            >
              Hoy
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link
              href={buildQuery(filters, { month: shiftMonthParam(month, 1) })}
              scroll={false}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </nav>
      </header>

      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Escritorio: rejilla mensual. */}
          <div className="hidden overflow-hidden rounded-lg border sm:block">
            <div className="grid grid-cols-7 border-b bg-muted/60">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="delta-eyebrow px-2 py-1.5 text-muted-foreground"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const key = dayKey(day);
                const entries = byDay.get(key) ?? [];
                const outside = !isSameMonth(day, month);
                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-28 border-r border-b p-1.5 last:border-r-0",
                      outside && "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          isToday(day) &&
                            "rounded-sm bg-delta-navy px-1.5 py-0.5 font-medium text-delta-paper dark:bg-delta-lime dark:text-delta-navy",
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {entries.map((entry) => (
                        <li key={`${entry.task.id}-${key}`}>
                          <TaskChip entry={entry} onSelect={setSelected} />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Móvil: agenda. Una rejilla de 7 columnas a 320 px no se lee. */}
          <div className="flex flex-col gap-3 sm:hidden">
            {visibleDays.length === 0 ? (
              <EmptyState
                title="Ningún plazo este mes"
                hint="Cambia de mes o quita filtros para ver tareas con plazo."
              />
            ) : (
              visibleDays.map((day) => {
                const key = dayKey(day);
                return (
                  <section key={key} className="flex flex-col gap-1.5">
                    <h3
                      className={cn(
                        "delta-eyebrow text-muted-foreground first-letter:uppercase",
                        isToday(day) && "text-foreground",
                      )}
                    >
                      {formatLongDate(key)}
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {(byDay.get(key) ?? []).map((entry) => (
                        <li key={`${entry.task.id}-${key}`}>
                          <TaskChip entry={entry} onSelect={setSelected} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })
            )}
          </div>
        </>
      )}

      <TaskDetailSheet
        task={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function TaskChip({
  entry,
  onSelect,
}: {
  entry: DayEntry;
  onSelect: (task: Task) => void;
}) {
  const { task, isStart } = entry;
  const overdue = isOverdue(task.due, task.status === "Listo");

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      title={task.name}
      className={cn(
        "w-full truncate rounded-sm px-1.5 py-1 text-left text-xs transition-colors",
        task.status === "Listo"
          ? "bg-delta-lime text-delta-navy"
          : "bg-delta-navy text-delta-paper dark:bg-delta-carbon",
        // Continuación de un rango: se atenúa y pierde el redondeo izquierdo
        // para que se lea como "viene de ayer".
        !isStart && "rounded-l-none opacity-70",
        overdue && "ring-1 ring-delta-navy/50 dark:ring-delta-lime/60",
      )}
    >
      {isStart ? task.name : `↳ ${task.name}`}
    </button>
  );
}
