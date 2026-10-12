"use client";

import { useState, type ReactNode } from "react";
import type { AreaId } from "@/lib/content/schema";

export type RoleItem = {
  id: string;
  areas: AreaId[];
  current: boolean;
  years: ReactNode;
  role: ReactNode;
  org: ReactNode;
  detail: ReactNode;
};

type View = "roles" | "education" | "principles";

type Labels = {
  views: string;
  tabs: Record<View, string>;
  filterGroup: string;
  all: string;
  current: string;
  highlighted: string;
};

type Filter = AreaId | "all";

// Experience as one screen: a view switcher (roles / education / how I work),
// a role picker next to the selected role's detail, and the closing buttons
// always visible. Panels not in view stay in the DOM with `hidden`. The area
// filter only sets data-filter; globals.css dims the roles outside the area.
export function ExperienceExplorer({
  areas,
  roles,
  education,
  principles,
  footer,
  labels,
}: {
  areas: { id: AreaId; label: string }[];
  roles: RoleItem[];
  education: ReactNode;
  principles: ReactNode;
  footer: ReactNode;
  labels: Labels;
}) {
  const [view, setView] = useState<View>("roles");
  const [selected, setSelected] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");

  const options: { id: Filter; label: string }[] = [{ id: "all", label: labels.all }, ...areas];
  const matching =
    filter === "all" ? roles.length : roles.filter((role) => role.areas.includes(filter)).length;
  const views: View[] = ["roles", "education", "principles"];
  const panel = "flex min-h-0 flex-1 flex-col gap-3";

  return (
    <div data-filter={filter} className="flex min-h-0 flex-1 flex-col gap-3">
      <div role="tablist" aria-label={labels.views} className="flex shrink-0 gap-1.5">
        {views.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`exp-tab-${id}`}
            aria-selected={view === id}
            aria-controls={`exp-panel-${id}`}
            onClick={() => setView(id)}
            className={`min-h-10 flex-1 rounded-full border px-2 font-mono text-[11px] tracking-[0.02em] sm:flex-none sm:px-5 sm:text-[13px] ${
              view === id
                ? "border-accent bg-surface-2 text-accent"
                : "border-border text-text-3 hover:text-text"
            }`}
          >
            {labels.tabs[id]}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id="exp-panel-roles"
        aria-labelledby="exp-tab-roles"
        hidden={view !== "roles"}
        className={panel}
      >
        <div
          role="group"
          aria-label={labels.filterGroup}
          className="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={option.id === filter}
              onClick={() => setFilter(option.id)}
              className={`min-h-10 shrink-0 whitespace-nowrap rounded-full border px-3.5 font-mono text-xs tracking-[0.04em] sm:px-[18px] sm:text-[13px] ${
                option.id === filter
                  ? "border-accent bg-accent text-bg"
                  : "border-border-strong bg-transparent text-text"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">
          {filter === "all"
            ? ""
            : labels.highlighted
                .replace("{count}", String(matching))
                .replace("{total}", String(roles.length))}
        </p>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 min-[900px]:grid-cols-[minmax(0,300px)_minmax(0,1fr)] min-[900px]:grid-rows-1 min-[900px]:gap-5">
          <ol className="grid grid-cols-3 gap-2 min-[900px]:flex min-[900px]:flex-col min-[900px]:gap-2.5">
            {roles.map((item, i) => (
              <li key={item.id} data-role="" data-areas={item.areas.join(" ")} className="flex">
                <button
                  type="button"
                  aria-pressed={i === selected}
                  aria-controls={`exp-role-${item.id}`}
                  onClick={() => setSelected(i)}
                  className={`flex w-full flex-col gap-1 rounded-card border p-2.5 text-left transition-colors min-[900px]:p-4 ${
                    i === selected
                      ? "border-accent bg-surface-2"
                      : "border-border bg-surface hover:border-border-strong"
                  }`}
                >
                  <span
                    className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-[0.04em] min-[900px]:text-xs ${
                      item.current ? "text-accent" : "text-text-3"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      data-role-dot=""
                      className={`hidden size-2.5 rounded-full border-2 border-accent min-[900px]:block ${
                        item.current ? "bg-accent" : "bg-bg"
                      }`}
                    />
                    <span>{item.years}</span>
                    {item.current && (
                      <span
                        data-current-badge=""
                        className="rounded-full bg-accent px-1.5 py-px uppercase text-bg"
                      >
                        {labels.current}
                      </span>
                    )}
                  </span>
                  <span className="hidden text-base font-extrabold leading-[1.15] tracking-[-0.01em] min-[900px]:block">
                    {item.role}
                  </span>
                  <span className="text-[13px] font-semibold leading-tight text-text-2 min-[900px]:text-sm min-[900px]:font-normal">
                    {item.org}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <div className="min-h-0 overflow-y-auto rounded-[18px] border border-border bg-surface p-4 min-[900px]:p-6">
            {roles.map((item, i) => (
              <div
                key={item.id}
                id={`exp-role-${item.id}`}
                hidden={i !== selected}
                data-role=""
                data-areas={item.areas.join(" ")}
              >
                {item.detail}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        role="tabpanel"
        id="exp-panel-education"
        aria-labelledby="exp-tab-education"
        hidden={view !== "education"}
        className={panel}
      >
        {education}
      </div>
      <div
        role="tabpanel"
        id="exp-panel-principles"
        aria-labelledby="exp-tab-principles"
        hidden={view !== "principles"}
        className={panel}
      >
        {principles}
      </div>

      <div className="mt-auto shrink-0">{footer}</div>
    </div>
  );
}
