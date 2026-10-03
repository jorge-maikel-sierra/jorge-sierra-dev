"use client";

import { useState, type ReactNode } from "react";
import type { AreaId } from "@/lib/content/schema";

type Filter = AreaId | "all";

// Sets data-filter on the wrapper; globals.css dims roles outside the area and
// highlights its chips, so the timeline itself stays a Server Component.
export function AreaFilter({
  areas,
  roleAreas,
  labels,
  children,
}: {
  areas: { id: AreaId; label: string }[];
  roleAreas: AreaId[][];
  labels: { group: string; all: string; highlighted: string };
  children: ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const options: { id: Filter; label: string }[] = [
    { id: "all", label: labels.all },
    ...areas,
  ];

  const count =
    filter === "all"
      ? roleAreas.length
      : roleAreas.filter((list) => list.includes(filter)).length;

  return (
    <div data-filter={filter} className="flex flex-col gap-7 sm:gap-10">
      <div
        role="group"
        aria-label={labels.group}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const active = option.id === filter;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.id)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 font-mono text-xs tracking-[0.04em] sm:px-[18px] sm:text-[13px] ${
                active
                  ? "border-accent bg-accent text-bg"
                  : "border-border-strong bg-transparent text-text"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="sr-only">
        {filter === "all"
          ? ""
          : labels.highlighted
              .replace("{count}", String(count))
              .replace("{total}", String(roleAreas.length))}
      </p>
      {children}
    </div>
  );
}
