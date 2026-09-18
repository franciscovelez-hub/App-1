import { ThemeToggle } from "@/components/theme-toggle";
import { CalendarView } from "@/components/tasks/calendar-view";
import { DemoBanner } from "@/components/tasks/demo-banner";
import { Filters } from "@/components/tasks/filters";
import { KanbanView } from "@/components/tasks/kanban-view";
import { KpiBar } from "@/components/tasks/kpi-bar";
import { TableView } from "@/components/tasks/table-view";
import { ViewTabs } from "@/components/tasks/view-tabs";
import { getTasksSnapshot } from "@/lib/notion/queries";
import {
  computeKpis,
  filterTasks,
  parseFilters,
  sortTasks,
  type SearchParams,
} from "@/lib/utils/tasks";

/**
 * Server Component. Aquí ocurre **toda** la lectura de datos: ningún componente
 * de cliente habla con Notion, solo recibe objetos planos ya filtrados.
 *
 * La caché real la lleva `unstable_cache` dentro de `queries.ts`; este
 * `revalidate` es el techo de la ruta.
 */
export const revalidate = 300;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const snapshot = await getTasksSnapshot();

  const visible = sortTasks(
    filterTasks(snapshot.tasks, filters),
    filters.sort,
    filters.direction,
  );
  const kpis = computeKpis(visible);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="delta-eyebrow text-muted-foreground">
            Delta Consulting Partners
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tareas de proyecto
          </h1>
          <p className="text-sm text-muted-foreground">
            Vista de solo lectura sobre Notion, que sigue siendo la fuente de
            verdad. {visible.length} de {snapshot.tasks.length} tareas.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {snapshot.isDemo ? <DemoBanner error={snapshot.error} /> : null}

      <KpiBar kpis={kpis} />

      <Filters
        companies={snapshot.companies.map((company) => ({
          value: company.id,
          label: company.name,
        }))}
        people={snapshot.people.map((person) => ({
          value: person.id,
          label: person.name ?? "Sin nombre",
        }))}
        filters={filters}
      />

      <ViewTabs view={filters.view}>
        {filters.view === "table" ? (
          <TableView tasks={visible} filters={filters} />
        ) : null}
        {filters.view === "kanban" ? <KanbanView tasks={visible} /> : null}
        {filters.view === "calendar" ? (
          <CalendarView tasks={visible} filters={filters} />
        ) : null}
      </ViewTabs>
    </main>
  );
}
