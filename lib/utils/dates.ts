import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

/**
 * Helpers de fecha. Todo entra y sale como cadena ISO porque los datos cruzan
 * la frontera Server → Client Component.
 *
 * `parseISO` interpreta `2026-09-17` como medianoche **local**, no UTC. Es la
 * diferencia entre que una tarea se pinte el día correcto o el anterior en
 * Bogotá (UTC-5), así que no se sustituye por `new Date(...)`.
 */

/** Lunes. Es la convención de Notion y la que espera el usuario en español. */
const WEEK_OPTIONS = { locale: es, weekStartsOn: 1 } as const;

export function toDate(iso: string): Date {
  return parseISO(iso);
}

/** Vencida: el plazo terminó antes de hoy y la tarea no está en "Listo". */
export function isOverdue(
  due: { start: string; end: string | null } | null,
  isDone: boolean,
): boolean {
  if (!due || isDone) return false;
  const deadline = startOfDay(toDate(due.end ?? due.start));
  return differenceInCalendarDays(deadline, startOfDay(new Date())) < 0;
}

/** Vence esta semana: entre hoy y el domingo de la semana en curso. */
export function isThisWeek(
  due: { start: string; end: string | null } | null,
): boolean {
  if (!due) return false;
  const deadline = startOfDay(toDate(due.end ?? due.start));
  const today = startOfDay(new Date());
  const end = endOfWeek(today, WEEK_OPTIONS);
  return isWithinInterval(deadline, { start: today, end });
}

/** "vence en 3 días", "venció hace 2 días", "vence hoy". */
export function relativeDue(
  due: { start: string; end: string | null } | null,
): string {
  if (!due) return "Sin plazo";
  const deadline = startOfDay(toDate(due.end ?? due.start));
  const days = differenceInCalendarDays(deadline, startOfDay(new Date()));

  if (days === 0) return "vence hoy";
  if (days === 1) return "vence mañana";
  if (days === -1) return "venció ayer";
  if (days > 1) return `vence en ${days} días`;
  return `venció hace ${Math.abs(days)} días`;
}

/** "17 sep" o "17 sep – 21 sep" para un rango. */
export function formatDueRange(
  due: { start: string; end: string | null; hasTime: boolean } | null,
): string {
  if (!due) return "—";
  const pattern = due.hasTime ? "d MMM, HH:mm" : "d MMM";
  const start = format(toDate(due.start), pattern, { locale: es });
  if (!due.end) return start;
  return `${start} – ${format(toDate(due.end), pattern, { locale: es })}`;
}

export function formatLongDate(iso: string): string {
  return format(toDate(iso), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

/** Clave `yyyy-MM-dd` para indexar tareas por día en el calendario. */
export function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Todos los días que ocupa un plazo, de inicio a fin. */
export function daysCovered(due: { start: string; end: string | null }): Date[] {
  const start = startOfDay(toDate(due.start));
  if (!due.end) return [start];
  const end = startOfDay(toDate(due.end));
  if (end < start) return [start];
  return eachDayOfInterval({ start, end });
}

/** Rejilla mensual completa, de lunes a domingo, incluyendo días de relleno. */
export function monthGrid(month: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  });
}

/** `2026-09` → Date del primer día. Si no es válido, devuelve el mes actual. */
export function parseMonthParam(value: string | undefined): Date {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return startOfMonth(new Date());
  const parsed = parseISO(`${value}-01`);
  return Number.isNaN(parsed.getTime()) ? startOfMonth(new Date()) : parsed;
}

export function monthParam(month: Date): string {
  return format(month, "yyyy-MM");
}

export function monthLabel(month: Date): string {
  return format(month, "LLLL 'de' yyyy", { locale: es });
}

/** Mes anterior o siguiente, como parámetro `yyyy-MM` listo para la URL. */
export function shiftMonthParam(month: Date, delta: number): string {
  return monthParam(addMonths(month, delta));
}

export const WEEKDAY_LABELS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

export { addDays, isSameDay, isSameMonth, isToday, startOfMonth };
