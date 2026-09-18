import { Card } from "@/components/ui/card";
import type { TaskKpis } from "@/lib/utils/tasks";

/**
 * Los cuatro números se calculan sobre las tareas **ya filtradas**, para que la
 * cabecera siempre describa lo que hay debajo y no un total que no se ve.
 */
const ITEMS: Array<{ key: keyof TaskKpis; label: string; hint: string }> = [
  { key: "open", label: "Abiertas", hint: "Todo lo que no está en Listo" },
  { key: "overdue", label: "Vencidas", hint: "Plazo pasado y sin terminar" },
  { key: "dueThisWeek", label: "Vencen esta semana", hint: "De hoy al domingo" },
  { key: "done", label: "Completadas", hint: "En estado Listo" },
];

export function KpiBar({ kpis }: { kpis: TaskKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ITEMS.map((item) => (
        <Card key={item.key} className="gap-1 p-4">
          <p className="delta-eyebrow text-muted-foreground">{item.label}</p>
          <p className="text-3xl font-semibold tabular-nums">{kpis[item.key]}</p>
          <p className="text-xs text-muted-foreground">{item.hint}</p>
        </Card>
      ))}
    </div>
  );
}
