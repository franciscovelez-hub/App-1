import { TriangleAlert } from "lucide-react";

/**
 * Aviso de que lo que se está viendo no son datos reales. Sin `NOTION_TOKEN`
 * la app sirve el mock, y eso tiene que ser imposible de confundir.
 */
export function DemoBanner({ error }: { error: string | null }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-delta-navy/25 bg-delta-lime/25 px-3 py-2 text-sm text-delta-navy dark:border-delta-lime/40 dark:bg-delta-lime/10 dark:text-delta-paper">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">Modo demo (datos de ejemplo)</p>
        <p className="text-delta-navy/80 dark:text-delta-paper/80">
          {error
            ? `No se pudo leer Notion: ${error}`
            : "Define NOTION_TOKEN en .env.local para leer las tareas reales de Notion."}
        </p>
      </div>
    </div>
  );
}
