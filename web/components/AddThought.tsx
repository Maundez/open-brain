"use client";

import { useState } from "react";

interface AddThoughtProps {
  show: boolean;
  onToggle: () => void;
  onCreated: () => void;
}

export default function AddThought({ show, onToggle, onCreated }: AddThoughtProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create thought");
      }
      setContent("");
      onToggle();
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="bg-surface border border-border rounded p-3 mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Capture a thought..."
        rows={3}
        className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-amber/50 focus:outline-none resize-y mb-2"
        autoFocus
      />
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onToggle}
          className="px-3 py-1 text-xs text-text-muted hover:text-text-secondary"
        >
          cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="px-3 py-1 text-xs border border-amber/30 text-amber rounded hover:bg-amber/10 disabled:opacity-50"
        >
          {loading ? "capturing..." : "capture"}
        </button>
      </div>
    </div>
  );
}
