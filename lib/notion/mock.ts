import type { Company, Meeting, Person, Task, TasksSnapshot } from "./types";

/**
 * Datos de ejemplo para ver la interfaz antes de configurar el token.
 *
 * Compañías y personas son ficticias. Los plazos se calculan relativos a hoy
 * para que el tablero siempre tenga tareas vencidas, tareas de esta semana y
 * tareas futuras, sin tener que editar el fichero cada semana.
 */

/** Fecha simple (sin hora) desplazada `offset` días respecto a hoy. */
function isoDay(offset: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

const companies: Company[] = [
  {
    id: "mock-company-1",
    name: "Andina Seguros",
    status: "En Proceso",
    product: "Ignition + CoE",
    url: "https://www.notion.so/",
  },
  {
    id: "mock-company-2",
    name: "Textiles Aburrá",
    status: "Propuesta",
    product: "Mindshift",
    url: "https://www.notion.so/",
  },
  {
    id: "mock-company-3",
    name: "Logística Poblado",
    status: "Discovery",
    product: "Ignition",
    url: "https://www.notion.so/",
  },
  {
    id: "mock-company-4",
    name: "Clínica Sabaneta",
    status: "Confirmación",
    product: "Acceleration",
    url: "https://www.notion.so/",
  },
  {
    id: "mock-company-5",
    name: "Cafetera Monteverde",
    status: "Cierre Exitoso",
    product: "Boardview",
    url: "https://www.notion.so/",
  },
];

const people: Person[] = [
  { id: "mock-person-1", name: "Camila Ossa", avatarUrl: null },
  { id: "mock-person-2", name: "Julián Tobón", avatarUrl: null },
  { id: "mock-person-3", name: "Daniela Arango", avatarUrl: null },
  { id: "mock-person-4", name: "Mateo Zuluaga", avatarUrl: null },
];

const meetings: Meeting[] = [
  {
    id: "mock-meeting-1",
    title: "Kickoff de diagnóstico con comité directivo",
    date: isoDay(-21),
    url: "https://www.notion.so/",
  },
  {
    id: "mock-meeting-2",
    title: "Revisión de casos de uso priorizados",
    date: isoDay(-12),
    url: "https://www.notion.so/",
  },
  {
    id: "mock-meeting-3",
    title: "Sesión de cierre del piloto de servicio al cliente",
    date: isoDay(-5),
    url: "https://www.notion.so/",
  },
  {
    id: "mock-meeting-4",
    title: "Comité de seguimiento mensual",
    date: isoDay(-2),
    url: "https://www.notion.so/",
  },
];

interface MockTaskInput {
  name: string;
  status: Task["status"];
  start: number | null;
  end?: number;
  company?: number;
  meeting?: number;
  assignees?: number[];
}

const inputs: MockTaskInput[] = [
  {
    name: "Consolidar hallazgos del diagnóstico de madurez en IA",
    status: "En progreso",
    start: -3,
    company: 0,
    meeting: 0,
    assignees: [0],
  },
  {
    name: "Entrevistas a líderes de operaciones y tecnología",
    status: "Listo",
    start: -18,
    end: -14,
    company: 0,
    meeting: 0,
    assignees: [0, 1],
  },
  {
    name: "Priorizar casos de uso con el comité directivo",
    status: "En progreso",
    start: 1,
    company: 0,
    meeting: 1,
    assignees: [1],
  },
  {
    name: "Diseñar el instrumento de medición de adopción",
    status: "Sin empezar",
    start: -6,
    company: 1,
    meeting: 1,
    assignees: [0, 2],
  },
  {
    name: "Taller de prompting para el equipo comercial",
    status: "Sin empezar",
    start: 3,
    end: 4,
    company: 1,
    meeting: 3,
    assignees: [2],
  },
  {
    name: "Definir línea base de productividad por área",
    status: "Sin empezar",
    start: -1,
    company: 1,
    assignees: [3],
  },
  {
    name: "Piloto de asistente para servicio al cliente",
    status: "En progreso",
    start: 2,
    end: 9,
    company: 2,
    meeting: 2,
    assignees: [1, 3],
  },
  {
    name: "Configurar el tablero de métricas del piloto",
    status: "Sin empezar",
    start: 5,
    company: 2,
    meeting: 2,
    assignees: [3],
  },
  {
    name: "Documentar los criterios de gobierno de datos",
    status: "Sin empezar",
    start: null,
    company: 2,
    assignees: [0],
  },
  {
    name: "Mapa de procesos candidatos a automatización",
    status: "Listo",
    start: -9,
    company: 3,
    meeting: 3,
    assignees: [2],
  },
  {
    name: "Propuesta de arquitectura para el centro de excelencia",
    status: "En progreso",
    start: 6,
    company: 3,
    assignees: [0, 2],
  },
  {
    name: "Plan de formación por rol para el primer trimestre",
    status: "Sin empezar",
    start: -4,
    company: 3,
    meeting: 3,
    assignees: [],
  },
  {
    name: "Informe ejecutivo de resultados del piloto",
    status: "Listo",
    start: -7,
    company: 4,
    meeting: 2,
    assignees: [1],
  },
  {
    name: "Encuesta de percepción post-taller",
    status: "Listo",
    start: -11,
    company: 4,
    assignees: [2],
  },
  {
    name: "Hoja de ruta de escalamiento a segunda ola de áreas",
    status: "Sin empezar",
    start: 14,
    end: 21,
    assignees: [0, 1, 3],
  },
];

function buildTasks(): Task[] {
  return inputs.map((input, index) => ({
    id: `mock-task-${index + 1}`,
    name: input.name,
    status: input.status,
    due:
      input.start === null
        ? null
        : {
            start: isoDay(input.start),
            end: input.end === undefined ? null : isoDay(input.end),
            hasTime: false,
          },
    assignees: (input.assignees ?? []).map((i) => people[i]!),
    companies: input.company === undefined ? [] : [companies[input.company]!],
    meetings: input.meeting === undefined ? [] : [meetings[input.meeting]!],
    url: "https://www.notion.so/",
  }));
}

export function mockSnapshot(): TasksSnapshot {
  const tasks = buildTasks();
  const collator = new Intl.Collator("es");
  return {
    tasks,
    companies: [...companies].sort((a, b) => collator.compare(a.name, b.name)),
    people: [...people].sort((a, b) =>
      collator.compare(a.name ?? "", b.name ?? ""),
    ),
    isDemo: true,
    error: null,
  };
}
