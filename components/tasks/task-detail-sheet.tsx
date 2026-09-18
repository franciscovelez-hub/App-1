"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Task } from "@/lib/notion/types";
import { formatDueRange, formatLongDate, relativeDue } from "@/lib/utils/dates";
import { isOverdue } from "@/lib/utils/dates";
import { Assignees } from "./assignees";
import { OverdueTag, StatusBadge } from "./status-badge";

/**
 * Detalle de una tarea. Solo lectura: el único botón que hay lleva a Notion,
 * que es donde se edita.
 */
export function TaskDetailSheet({
  task,
  onOpenChange,
}: {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
}) {
  const overdue = task
    ? isOverdue(task.due, task.status === "Listo")
    : false;

  return (
    <Sheet open={task !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {task ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-balance">{task.name}</SheetTitle>
              <SheetDescription>
                {task.due
                  ? `${formatDueRange(task.due)} · ${relativeDue(task.due)}`
                  : "Esta tarea no tiene plazo definido."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={task.status} />
                {overdue ? <OverdueTag /> : null}
              </div>

              <Separator />

              <Field label="Responsable">
                <Assignees people={task.assignees} />
              </Field>

              <Field label="Compañía">
                {task.companies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {task.companies.map((company) => (
                      <Badge key={company.id} variant="outline">
                        {company.name}
                        {company.product ? ` · ${company.product}` : ""}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Muted>Sin compañía asociada</Muted>
                )}
              </Field>

              <Field label="Plazo">
                {task.due ? (
                  <p className="text-sm">
                    {formatLongDate(task.due.start)}
                    {task.due.end ? ` → ${formatLongDate(task.due.end)}` : ""}
                  </p>
                ) : (
                  <Muted>Sin plazo</Muted>
                )}
              </Field>

              <Field label="Acta origen">
                {task.meetings.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {task.meetings.map((meeting) => (
                      <li key={meeting.id}>
                        <a
                          href={meeting.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
                        >
                          {meeting.title}
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Muted>Sin acta asociada</Muted>
                )}
              </Field>

              <Button asChild className="w-full">
                <a href={task.url} target="_blank" rel="noreferrer">
                  Abrir en Notion
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="delta-eyebrow text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
