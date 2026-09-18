import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Person } from "@/lib/notion/types";
import { initials } from "@/lib/utils/tasks";

/**
 * Responsables. `avatar_url` y `name` solo llegan si la integración de Notion
 * tiene permiso para leer información de usuarios; si no, caemos a iniciales
 * sin que la interfaz se rompa.
 */
export function Assignees({
  people,
  showNames = true,
  className,
}: {
  people: Person[];
  showNames?: boolean;
  className?: string;
}) {
  if (people.length === 0) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        Sin responsable
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex -space-x-1.5">
        {people.map((person) => (
          <Avatar
            key={person.id}
            className="size-6 border border-background"
            title={person.name ?? "Responsable sin nombre"}
          >
            {person.avatarUrl ? (
              <AvatarImage src={person.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-delta-navy text-[0.625rem] text-delta-paper dark:bg-delta-lime dark:text-delta-navy">
              {initials(person.name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      {showNames ? (
        <span className="truncate text-sm">
          {people
            .map((person) => person.name ?? "Sin nombre")
            .join(", ")}
        </span>
      ) : null}
    </div>
  );
}
