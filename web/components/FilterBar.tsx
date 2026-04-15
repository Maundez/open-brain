"use client";

import { useEffect, useRef, useState } from "react";

interface Filters {
  q: string;
  mode: "text" | "semantic";
  type: string;
  topic: string;
  person: string;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [localQ, setLocalQ] = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalQ(filters.q);
  }, [filters.q]);

  const handleSearch = (value: string) => {
    setLocalQ(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, q: value });
    }, 300);
  };

  const update = (partial: Partial<Filters>) => {
    onChange({ ...filters, ...partial });
  };

  const hasFilters = filters.q || filters.type || filters.topic || filters.person;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex-1 min-w-[200px] relative">
        <input
          type="text"
          value={localQ}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search thoughts..."
          className="w-full bg-bg border border-border rounded px-3 py-1.5 text-text-primary placeholder:text-text-muted focus:border-amber/50 focus:outline-none"
        />
      </div>

      <button
        onClick={() =>
          update({ mode: filters.mode === "text" ? "semantic" : "text" })
        }
        className={`px-2 py-1.5 rounded border text-xs ${
          filters.mode === "semantic"
            ? "border-amber text-amber bg-amber/10"
            : "border-border text-text-secondary hover:border-border-hover"
        }`}
        title={
          filters.mode === "semantic"
            ? "Semantic search (meaning-based)"
            : "Text search (keyword match)"
        }
      >
        {filters.mode === "semantic" ? "semantic" : "text"}
      </button>

      <select
        value={filters.type}
        onChange={(e) => update({ type: e.target.value })}
        className="bg-bg border border-border rounded px-2 py-1.5 text-text-secondary focus:border-amber/50 focus:outline-none"
      >
        <option value="">all types</option>
        <option value="observation">observation</option>
        <option value="task">task</option>
        <option value="idea">idea</option>
        <option value="reference">reference</option>
        <option value="person_note">person_note</option>
      </select>

      <input
        type="text"
        value={filters.topic}
        onChange={(e) => update({ topic: e.target.value })}
        placeholder="topic"
        className="w-24 bg-bg border border-border rounded px-2 py-1.5 text-text-secondary placeholder:text-text-muted focus:border-amber/50 focus:outline-none"
      />

      <input
        type="text"
        value={filters.person}
        onChange={(e) => update({ person: e.target.value })}
        placeholder="person"
        className="w-24 bg-bg border border-border rounded px-2 py-1.5 text-text-secondary placeholder:text-text-muted focus:border-amber/50 focus:outline-none"
      />

      {hasFilters && (
        <button
          onClick={() =>
            onChange({ q: "", mode: "text", type: "", topic: "", person: "" })
          }
          className="px-2 py-1.5 text-xs text-text-muted hover:text-text-secondary"
        >
          clear
        </button>
      )}
    </div>
  );
}
