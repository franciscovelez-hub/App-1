import { isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { unstable_cache } from "next/cache";
import { databaseIds, getNotionClient, isNotionConfigured } from "./client";
import { mapCompany, mapMeeting, mapTask, type MappedTask } from "./mappers";
import { mockSnapshot } from "./mock";
import type { Company, Meeting, Person, Task, TasksSnapshot } from "./types";

/**
 * Lectura de Notion. Tres reglas que gobiernan este fichero:
 *
 * 1. Solo lectura. No hay un solo `create` ni `update` en todo el proyecto.
 * 2. Las relaciones se resuelven en lote: una consulta por base, nunca una por
 *    tarea. Con el límite de ~3 req/s de Notion, lo segundo es inviable.
 * 3. Todo se pagina con `start_cursor` hasta agotar `has_more`.
 */

/** Cachea 5 minutos, que es el margen que pide el rate limit de Notion. */
const REVALIDATE_SECONDS = 300;

/**
 * Desde la versión 2025-09-03 de la API, `databases.query` ya no existe: se
 * consulta una *data source*, y una base puede tener varias. Las variables de
 * entorno guardan ids de base (que es lo que se ve en la URL de Notion), así
 * que hay que traducirlas. La traducción se cachea con el resto.
 */
async function resolveDataSourceId(databaseId: string): Promise<string> {
  const notion = getNotionClient();
  const database = await notion.databases.retrieve({ database_id: databaseId });
  if (!("data_sources" in database) || database.data_sources.length === 0) {
    throw new Error(
      `La base ${databaseId} no expone ninguna data source. Revisa que la integración tenga acceso.`,
    );
  }
  // Una base creada desde la interfaz de Notion tiene exactamente una.
  return database.data_sources[0]!.id;
}

/** Recorre una data source entera, página a página, y devuelve las páginas completas. */
async function queryAllPages(databaseId: string): Promise<PageObjectResponse[]> {
  if (!databaseId) return [];
  const notion = getNotionClient();
  const dataSourceId = await resolveDataSourceId(databaseId);

  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const result of response.results) {
      if (isFullPage(result)) pages.push(result);
    }
    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return pages;
}

/** Todas las tareas de TASKS, sin las relaciones resueltas todavía. */
export async function getTasks(): Promise<MappedTask[]> {
  const pages = await queryAllPages(databaseIds.tasks);
  return pages.map(mapTask);
}

/**
 * Compañías por id. Hace **una** consulta a CRM y filtra en memoria: Notion no
 * permite filtrar por id de página, y una petición por compañía agotaría el
 * rate limit en cuanto haya una docena de tareas.
 */
export async function getCompaniesById(
  ids: readonly string[],
): Promise<Map<string, Company>> {
  const wanted = new Set(ids);
  if (wanted.size === 0) return new Map();
  const pages = await queryAllPages(databaseIds.crm);
  const result = new Map<string, Company>();
  for (const page of pages) {
    if (wanted.has(page.id)) result.set(page.id, mapCompany(page));
  }
  return result;
}

/** Actas por id. Mismo criterio que `getCompaniesById`. */
export async function getMeetingsById(
  ids: readonly string[],
): Promise<Map<string, Meeting>> {
  const wanted = new Set(ids);
  if (wanted.size === 0) return new Map();
  const pages = await queryAllPages(databaseIds.actas);
  const result = new Map<string, Meeting>();
  for (const page of pages) {
    if (wanted.has(page.id)) result.set(page.id, mapMeeting(page));
  }
  return result;
}

/** Une tareas y relaciones en el modelo que consumen las vistas. */
function assemble(
  mapped: MappedTask[],
  companies: Map<string, Company>,
  meetings: Map<string, Meeting>,
): Task[] {
  return mapped.map(({ companyIds, meetingIds, ...task }) => ({
    ...task,
    companies: companyIds
      .map((id) => companies.get(id))
      .filter((company): company is Company => company !== undefined),
    meetings: meetingIds
      .map((id) => meetings.get(id))
      .filter((meeting): meeting is Meeting => meeting !== undefined),
  }));
}

/** Opciones de filtro deducidas de los datos, sin duplicados y ordenadas. */
function collectFilterOptions(tasks: Task[]): {
  companies: Company[];
  people: Person[];
} {
  const companies = new Map<string, Company>();
  const people = new Map<string, Person>();
  for (const task of tasks) {
    for (const company of task.companies) companies.set(company.id, company);
    for (const person of task.assignees) people.set(person.id, person);
  }
  const collator = new Intl.Collator("es");
  return {
    companies: [...companies.values()].sort((a, b) =>
      collator.compare(a.name, b.name),
    ),
    people: [...people.values()].sort((a, b) =>
      collator.compare(a.name ?? "", b.name ?? ""),
    ),
  };
}

async function readFromNotion(): Promise<TasksSnapshot> {
  const mapped = await getTasks();
  const companyIds = [...new Set(mapped.flatMap((task) => task.companyIds))];
  const meetingIds = [...new Set(mapped.flatMap((task) => task.meetingIds))];

  // Dos consultas en paralelo, una por base relacionada.
  const [companies, meetings] = await Promise.all([
    getCompaniesById(companyIds),
    getMeetingsById(meetingIds),
  ]);

  const tasks = assemble(mapped, companies, meetings);
  return { tasks, ...collectFilterOptions(tasks), isDemo: false, error: null };
}

const readFromNotionCached = unstable_cache(readFromNotion, ["tasks-snapshot"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["tasks"],
});

/**
 * Punto de entrada único de las vistas.
 *
 * Sin `NOTION_TOKEN` sirve el mock y lo declara en la interfaz. Si Notion
 * responde con error, también cae al mock, pero propaga el mensaje: fallar en
 * silencio dando datos de ejemplo por buenos sería lo peor que podría hacer.
 */
export async function getTasksSnapshot(): Promise<TasksSnapshot> {
  if (!isNotionConfigured) return mockSnapshot();

  try {
    return await readFromNotionCached();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido al leer Notion";
    return { ...mockSnapshot(), error: message };
  }
}
