import { cn } from "@/lib/utils";

/** `tec §T4`: un estado vacío invita a actuar, no consuela. */
export function EmptyState({
  title = "No hay tareas con estos filtros",
  hint = "Quita algún filtro o limpia la búsqueda para ver más resultados.",
  className,
}: {
  title?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
