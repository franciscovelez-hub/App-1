import { Client } from "@notionhq/client";

/**
 * Cliente de Notion. Solo lectura: esta aplicación nunca escribe en el
 * workspace, Notion sigue siendo la fuente de verdad.
 */

export const notionToken = process.env.NOTION_TOKEN?.trim() ?? "";

/** Sin token no hay lectura posible: la app cae al mock y avisa en la interfaz. */
export const isNotionConfigured = notionToken.length > 0;

let client: Client | null = null;

export function getNotionClient(): Client {
  if (!isNotionConfigured) {
    throw new Error(
      "NOTION_TOKEN no está definido. La aplicación debería estar usando el mock.",
    );
  }
  client ??= new Client({
    auth: notionToken,
    // El límite es ~3 req/s. El SDK ya reintenta con back-off ante un 429.
    timeoutMs: 30_000,
  });
  return client;
}

/** Ids de las cuatro bases, tal cual vienen del entorno. */
export const databaseIds = {
  tasks: normalizeId(process.env.NOTION_DB_TASKS),
  crm: normalizeId(process.env.NOTION_DB_CRM),
  actas: normalizeId(process.env.NOTION_DB_ACTAS),
  people: normalizeId(process.env.NOTION_DB_PEOPLE),
} as const;

/**
 * Notion acepta el id con o sin guiones, pero no con espacios ni con la parte
 * de consulta de una URL pegada detrás. Esto tolera las tres formas.
 */
export function normalizeId(raw: string | undefined): string {
  if (!raw) return "";
  const compact = raw.replace(/[\s-]/g, "").toLowerCase();
  const match = compact.match(/[0-9a-f]{32}/);
  return match ? match[0] : "";
}

/** URL pública de una página de Notion a partir de su id. */
export function notionPageUrl(id: string): string {
  return `https://www.notion.so/${id.replace(/-/g, "")}`;
}
