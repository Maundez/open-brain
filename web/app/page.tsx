"use client";

import { useCallback, useEffect, useState } from "react";
import { Thought, ThoughtMetadata } from "@/lib/types";
import FilterBar from "@/components/FilterBar";
import ThoughtCard from "@/components/ThoughtCard";
import AddThought from "@/components/AddThought";
import DeleteConfirm from "@/components/DeleteConfirm";
import Pagination from "@/components/Pagination";
import StatsPanel from "@/components/StatsPanel";

interface Filters {
  q: string;
  mode: "text" | "semantic";
  type: string;
  topic: string;
  person: string;
}

export default function Home() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<Filters>({
    q: "",
    mode: "text",
    type: "",
    topic: "",
    person: "",
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const fetchThoughts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (filters.q) {
      params.set("q", filters.q);
      params.set("mode", filters.mode);
    }
    if (filters.type) params.set("type", filters.type);
    if (filters.topic) params.set("topic", filters.topic);
    if (filters.person) params.set("person", filters.person);

    try {
      const res = await fetch(`/api/thoughts?${params}`);
      const data = await res.json();
      setThoughts(data.data || []);
      setTotalCount(data.count || 0);
    } catch {
      setThoughts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchThoughts();
  }, [fetchThoughts]);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSave = async (
    id: string,
    updates: { content?: string; metadata?: Partial<ThoughtMetadata> }
  ) => {
    const res = await fetch(`/api/thoughts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save");
    }
    setEditingId(null);
    fetchThoughts();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await fetch(`/api/thoughts/${deletingId}`, { method: "DELETE" });
    setDeletingId(null);
    fetchThoughts();
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 text-xs border border-amber/30 text-amber rounded hover:bg-amber/10"
        >
          {showAdd ? "- cancel" : "+ capture"}
        </button>
        <button
          onClick={() => setShowStats(true)}
          className="px-3 py-1.5 text-xs border border-border text-text-secondary rounded hover:border-border-hover"
        >
          stats
        </button>
        <span className="text-text-muted text-xs ml-auto">
          {totalCount} thought{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      <AddThought
        show={showAdd}
        onToggle={() => setShowAdd(false)}
        onCreated={fetchThoughts}
      />

      <FilterBar filters={filters} onChange={handleFiltersChange} />

      {loading ? (
        <p className="text-text-muted text-xs py-8 text-center">loading...</p>
      ) : thoughts.length === 0 ? (
        <p className="text-text-muted text-xs py-8 text-center">
          no thoughts found
        </p>
      ) : (
        <div className="space-y-2">
          {thoughts.map((t) => (
            <ThoughtCard
              key={t.id}
              thought={t}
              isEditing={editingId === t.id}
              onEdit={() => setEditingId(t.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(updates) => handleSave(t.id, updates)}
              onDelete={() => setDeletingId(t.id)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <StatsPanel show={showStats} onClose={() => setShowStats(false)} />

      {deletingId && (
        <DeleteConfirm
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </>
  );
}
