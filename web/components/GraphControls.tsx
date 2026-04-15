"use client";

import { useState } from "react";
import type { GraphFilters } from "@/lib/graph";
import { typeColourMap, ALL_TYPES } from "@/lib/graph";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  filters: GraphFilters;
  setFilters: (f: GraphFilters) => void;
  onZoomToFit: () => void;
  allTopics: string[];
  allPeople: string[];
}

// ---------------------------------------------------------------------------
// Labels for display
// ---------------------------------------------------------------------------

const typeLabels: Record<string, string> = {
  observation: "Observation",
  task: "Task",
  idea: "Idea",
  reference: "Reference",
  person_note: "Person note",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GraphControls({
  filters,
  setFilters,
  onZoomToFit,
  allTopics,
  allPeople,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleType = (type: string) => {
    const next = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    setFilters({ ...filters, types: next });
  };

  const showAll = () => {
    setFilters({ ...filters, types: [...ALL_TYPES] });
  };

  const clearFilters = () => {
    setFilters({ types: [...ALL_TYPES], topic: null, person: null });
  };

  const hasActiveFilter =
    filters.types.length < ALL_TYPES.length ||
    filters.topic !== null ||
    filters.person !== null;

  return (
    <div className="w-64 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
          Controls
        </span>
        <button
          aria-label={collapsed ? "Expand controls" : "Collapse controls"}
          onClick={() => setCollapsed((c) => !c)}
          className="text-text-muted hover:text-text-primary transition-colors text-sm leading-none"
        >
          {collapsed ? "▼" : "▲"}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-4">
          {/* Type filter */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-xs">Types</span>
              <button
                onClick={showAll}
                className="text-text-muted hover:text-amber text-xs transition-colors"
              >
                Show all
              </button>
            </div>
            <div className="space-y-1.5">
              {ALL_TYPES.map((type) => {
                const active = filters.types.includes(type);
                return (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleType(type)}
                      className="sr-only"
                    />
                    {/* Custom checkbox */}
                    <span
                      className="w-3.5 h-3.5 rounded-sm border border-border flex-shrink-0 flex items-center justify-center transition-colors"
                      style={
                        active
                          ? {
                              background: typeColourMap[type],
                              borderColor: typeColourMap[type],
                            }
                          : {}
                      }
                    >
                      {active && (
                        <svg
                          className="w-2.5 h-2.5 text-bg"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M2 5l2.5 2.5L8 3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-xs transition-colors ${active ? "text-text-primary" : "text-text-muted"}`}
                    >
                      {typeLabels[type] ?? type}
                    </span>
                    {/* Colour dot */}
                    <span
                      className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: typeColourMap[type] }}
                    />
                  </label>
                );
              })}
            </div>
          </section>

          {/* Topic filter */}
          {allTopics.length > 0 && (
            <section>
              <span className="text-text-secondary text-xs block mb-1.5">
                Topic highlight
              </span>
              <select
                value={filters.topic ?? ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    topic: e.target.value || null,
                  })
                }
                className="w-full bg-bg border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-amber transition-colors"
              >
                <option value="">All topics</option>
                {allTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </section>
          )}

          {/* Person filter */}
          {allPeople.length > 0 && (
            <section>
              <span className="text-text-secondary text-xs block mb-1.5">
                Person highlight
              </span>
              <select
                value={filters.person ?? ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    person: e.target.value || null,
                  })
                }
                className="w-full bg-bg border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-amber transition-colors"
              >
                <option value="">All people</option>
                {allPeople.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </section>
          )}

          {/* Action buttons */}
          <section className="space-y-2">
            <button
              onClick={onZoomToFit}
              className="w-full text-xs border border-border hover:border-border-hover text-text-secondary hover:text-text-primary rounded px-3 py-1.5 transition-colors"
            >
              Fit graph
            </button>
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="w-full text-xs border border-amber text-amber hover:bg-amber hover:text-bg rounded px-3 py-1.5 transition-colors"
              >
                Clear filters
              </button>
            )}
          </section>

          {/* Legend */}
          <section>
            <span className="text-text-secondary text-xs block mb-1.5">
              Legend
            </span>
            <div className="space-y-1">
              {ALL_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: typeColourMap[type] }}
                  />
                  <span className="text-text-muted text-xs">
                    {typeLabels[type] ?? type}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
