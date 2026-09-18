/**
 * Tipos de dominio de la aplicación.
 *
 * Regla: los tipos crudos del SDK de Notion (`PageObjectResponse` y compañía)
 * no salen nunca de `lib/notion/`. Fuera de esta carpeta solo existe lo que
 * está declarado en este fichero.
 *
 * Las fechas viajan como cadenas ISO, no como `Date`, porque los datos cruzan
 * la frontera Server → Client Component y tienen que ser serializables.
 */

export const TASK_STATUSES = ["Sin empezar", "En progreso", "Listo"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Estado tal y como llega de Notion, ya normalizado a las tres opciones. */
export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

export interface Person {
  id: string;
  /** Puede ser `null` si la integración no tiene permiso de leer usuarios. */
  name: string | null;
  avatarUrl: string | null;
}

export interface Company {
  id: string;
  name: string;
  status: string | null;
  product: string | null;
  url: string;
}

export interface Meeting {
  id: string;
  title: string;
  /** ISO. `null` si el acta no tiene fecha. */
  date: string | null;
  url: string;
}

export interface DueDate {
  /** ISO. Fecha simple (`2026-09-17`) o instante completo. */
  start: string;
  /** ISO. `null` cuando el plazo es un día suelto y no un rango. */
  end: string | null;
  /** `false` cuando Notion guardó solo la fecha, sin hora. */
  hasTime: boolean;
}

export interface Task {
  id: string;
  name: string;
  status: TaskStatus | null;
  due: DueDate | null;
  assignees: Person[];
  companies: Company[];
  meetings: Meeting[];
  /** Enlace a la página de la tarea en Notion. */
  url: string;
}

/** Lo que la vista necesita para pintarse entera. */
export interface TasksSnapshot {
  tasks: Task[];
  /** Opciones de filtro, ya deduplicadas y ordenadas. */
  companies: Company[];
  people: Person[];
  /** `true` cuando no hay `NOTION_TOKEN` y se están sirviendo datos de ejemplo. */
  isDemo: boolean;
  /** Mensaje de error si la lectura de Notion falló y se cayó al mock. */
  error: string | null;
}
