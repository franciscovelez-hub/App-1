import type { PageObjectResponse } from "@notionhq/client";
import { notionPageUrl } from "./client";
import {
  isTaskStatus,
  type Company,
  type DueDate,
  type Meeting,
  type Person,
  type Task,
} from "./types";

/**
 * Funciones puras: página de Notion → tipo de dominio.
 *
 * Todas asumen lo peor. Una propiedad puede no existir, llamarse igual pero ser
 * de otro tipo, o venir vacía; en ningún caso el mapper lanza.
 */

type PropertyValue = PageObjectResponse["properties"][string];

function property(
  page: PageObjectResponse,
  name: string,
): PropertyValue | undefined {
  return page.properties[name];
}

/** Concatena un array de rich text a texto plano. */
function plainText(
  items: ReadonlyArray<{ plain_text: string }> | undefined,
): string {
  if (!items || items.length === 0) return "";
  return items.map((item) => item.plain_text).join("").trim();
}

export function readTitle(page: PageObjectResponse, name: string): string {
  const prop = property(page, name);
  if (prop?.type === "title") return plainText(prop.title);
  // La propiedad title puede haber sido renombrada en Notion: la buscamos por tipo.
  for (const candidate of Object.values(page.properties)) {
    if (candidate.type === "title") return plainText(candidate.title);
  }
  return "";
}

export function readStatus(page: PageObjectResponse, name: string) {
  const prop = property(page, name);
  if (prop?.type === "status") return prop.status?.name ?? null;
  if (prop?.type === "select") return prop.select?.name ?? null;
  return null;
}

export function readSelect(page: PageObjectResponse, name: string) {
  const prop = property(page, name);
  if (prop?.type === "select") return prop.select?.name ?? null;
  if (prop?.type === "status") return prop.status?.name ?? null;
  return null;
}

export function readDate(page: PageObjectResponse, name: string): DueDate | null {
  const prop = property(page, name);
  if (prop?.type !== "date" || !prop.date?.start) return null;
  const { start, end } = prop.date;
  return {
    start,
    // Un rango de un solo día se guarda a veces con start === end: no es rango.
    end: end && end !== start ? end : null,
    hasTime: start.includes("T"),
  };
}

export function readPeople(page: PageObjectResponse, name: string): Person[] {
  const prop = property(page, name);
  if (prop?.type !== "people") return [];
  return prop.people.map((user) => ({
    id: user.id,
    // `name` y `avatar_url` solo llegan si la integración tiene permiso de
    // leer información de usuarios. Si no, la interfaz cae a iniciales.
    name: "name" in user ? (user.name ?? null) : null,
    avatarUrl: "avatar_url" in user ? (user.avatar_url ?? null) : null,
  }));
}

export function readRelationIds(
  page: PageObjectResponse,
  name: string,
): string[] {
  const prop = property(page, name);
  if (prop?.type !== "relation") return [];
  return prop.relation.map((item) => item.id);
}

/** Nombres de propiedad de la base TASKS, tal cual están escritos en Notion. */
export const TASK_PROPERTIES = {
  name: "Nombre de la tarea",
  status: "Estado",
  due: "Plazo",
  assignees: "Responsable",
  company: "Compañía",
  meeting: "Acta origen",
} as const;

export interface MappedTask extends Omit<Task, "companies" | "meetings"> {
  companyIds: string[];
  meetingIds: string[];
}

/** Tarea sin relaciones resueltas: `queries.ts` las rellena después en lote. */
export function mapTask(page: PageObjectResponse): MappedTask {
  const status = readStatus(page, TASK_PROPERTIES.status);
  return {
    id: page.id,
    name: readTitle(page, TASK_PROPERTIES.name) || "(sin nombre)",
    status: status && isTaskStatus(status) ? status : null,
    due: readDate(page, TASK_PROPERTIES.due),
    assignees: readPeople(page, TASK_PROPERTIES.assignees),
    companyIds: readRelationIds(page, TASK_PROPERTIES.company),
    meetingIds: readRelationIds(page, TASK_PROPERTIES.meeting),
    url: page.url || notionPageUrl(page.id),
  };
}

export function mapCompany(page: PageObjectResponse): Company {
  return {
    id: page.id,
    name: readTitle(page, "Compañía") || "(compañía sin nombre)",
    status: readStatus(page, "Status"),
    product: readSelect(page, "Producto"),
    url: page.url || notionPageUrl(page.id),
  };
}

export function mapMeeting(page: PageObjectResponse): Meeting {
  const date = readDate(page, "Fecha");
  return {
    id: page.id,
    title:
      readTitle(page, "Descripción corta de la reunión") || "(acta sin título)",
    date: date?.start ?? null,
    url: page.url || notionPageUrl(page.id),
  };
}
