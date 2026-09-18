"use client";

import { CalendarDays, KanbanSquare, Table2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VIEWS, type ViewKey } from "@/lib/utils/tasks";

const LABELS: Record<ViewKey, { label: string; icon: typeof Table2 }> = {
  table: { label: "Tabla", icon: Table2 },
  kanban: { label: "Kanban", icon: KanbanSquare },
  calendar: { label: "Calendario", icon: CalendarDays },
};

/**
 * La pestaña activa vive en `?view=`. Solo se renderiza la vista activa: el
 * servidor decide cuál, este componente solo mueve el parámetro.
 */
export function ViewTabs({
  view,
  children,
}: {
  view: ViewKey;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "table") params.delete("view");
    else params.set("view", next);
    // El mes solo tiene sentido en el calendario.
    if (next !== "calendar") params.delete("month");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <Tabs value={view} onValueChange={onChange} className="gap-4">
      <TabsList>
        {VIEWS.map((key) => {
          const { label, icon: Icon } = LABELS[key];
          return (
            <TabsTrigger key={key} value={key}>
              <Icon className="size-4" aria-hidden />
              {label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {children}
    </Tabs>
  );
}
