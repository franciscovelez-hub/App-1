"use client";

import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TASK_STATUSES } from "@/lib/notion/types";
import type { TaskFilters } from "@/lib/utils/tasks";

/**
 * Único componente de cliente que escribe estado: todos los filtros viven en la
 * URL, así que una vista filtrada se comparte pegando el enlace. El filtrado
 * real lo hace el Server Component al releer los search params.
 */

interface Option {
  value: string;
  label: string;
}

export function Filters({
  companies,
  people,
  filters,
}: {
  companies: Option[];
  people: Option[];
  filters: TaskFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.query);

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const queryString = params.toString();
      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  // El buscador espera a que el usuario deje de teclear antes de tocar la URL.
  useEffect(() => {
    if (query === filters.query) return;
    const timer = setTimeout(() => {
      commit((params) => {
        if (query) params.set("q", query);
        else params.delete("q");
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, filters.query, commit]);

  const toggle = (key: string, value: string, selected: string[]) => {
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    commit((params) => {
      if (next.length > 0) params.set(key, next.join(","));
      else params.delete(key);
    });
  };

  const clearAll = () => {
    commit((params) => {
      for (const key of ["company", "assignee", "status", "q"]) {
        params.delete(key);
      }
    });
    setQuery("");
  };

  const activeCount =
    filters.companies.length +
    filters.assignees.length +
    filters.statuses.length +
    (filters.query ? 1 : 0);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center",
        isPending && "opacity-70",
      )}
    >
      <div className="relative sm:w-64">
        <Search
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar tarea"
          aria-label="Buscar por nombre de tarea"
          className="pl-8"
        />
      </div>

      <MultiSelect
        label="Compañía"
        options={companies}
        selected={filters.companies}
        onToggle={(value) => toggle("company", value, filters.companies)}
      />
      <MultiSelect
        label="Responsable"
        options={people}
        selected={filters.assignees}
        onToggle={(value) => toggle("assignee", value, filters.assignees)}
      />
      <MultiSelect
        label="Estado"
        options={TASK_STATUSES.map((status) => ({
          value: status,
          label: status,
        }))}
        selected={filters.statuses}
        onToggle={(value) => toggle("status", value, filters.statuses)}
      />

      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-4" aria-hidden />
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between gap-2 sm:w-48"
        >
          <span className="truncate">{label}</span>
          {selected.length > 0 ? (
            <Badge className="bg-delta-navy text-delta-paper dark:bg-delta-lime dark:text-delta-navy">
              {selected.length}
            </Badge>
          ) : (
            <ChevronsUpDown className="size-4 opacity-60" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${label.toLowerCase()}`} />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => onToggle(option.value)}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
