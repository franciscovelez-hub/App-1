import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/notion/types";

/**
 * Colores de estado, idénticos en las tres vistas.
 *
 * Paleta cerrada de `tec §T1.2`: no hay gris, azul ni verde genéricos. Cada
 * combinación está elegida para cumplir contraste AA en claro y en oscuro, por
 * eso "En progreso" cambia de Navy a Carbon en modo oscuro: sobre fondo Navy
 * un chip Navy sería invisible.
 */
const STATUS_STYLES: Record<TaskStatus, string> = {
  "Sin empezar":
    "bg-delta-paper text-delta-carbon border-delta-carbon/25 dark:border-delta-carbon/40",
  "En progreso":
    "bg-delta-navy text-delta-paper dark:bg-delta-carbon dark:text-delta-paper dark:border-delta-paper/25",
  Listo: "bg-delta-lime text-delta-navy",
};

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus | null;
  className?: string;
}) {
  if (!status) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        Sin estado
      </Badge>
    );
  }

  return (
    <Badge className={cn("border", STATUS_STYLES[status], className)}>
      {status}
    </Badge>
  );
}

/**
 * Marca de tarea vencida. Sin rojo: `tec §T1.2` cierra la paleta, así que la
 * señal es tipográfica (eyebrow en mono, `manual §4.4`) y no cromática. Va
 * siempre acompañada del plazo, nunca sola.
 */
export function OverdueTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "delta-eyebrow inline-flex items-center rounded-sm border border-delta-navy/40 px-1.5 py-0.5 text-delta-navy dark:border-delta-lime/50 dark:text-delta-lime",
        className,
      )}
    >
      Vencida
    </span>
  );
}
