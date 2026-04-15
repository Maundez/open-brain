"use client";

import { useState } from "react";
import { Thought, ThoughtMetadata } from "@/lib/types";

interface ThoughtCardProps {
  thought: Thought;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: { content?: string; metadata?: Partial<ThoughtMetadata> }) => Promise<void>;
  onDelete: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  observation: "bg-amber/10 text-amber",
  task: "bg-blue-500/10 text-blue-400",
  idea: "bg-purple-500/10 text-purple-400",
  reference: "bg-green-500/10 text-green-400",
  person_note: "bg-pink-500/10 text-pink-400",
};

export default function ThoughtCard({
  thought,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: ThoughtCardProps) {
  const [editContent, setEditContent] = useState(thought.content);
  const [editType, setEditType] = useState(thought.metadata.type);
  const [editTopics, setEditTopics] = useState(thought.metadata.topics.join(", "));
  const [editPeople, setEditPeople] = useState(thought.metadata.people.join(", "));
  const [editActions, setEditActions] = useState(thought.metadata.action_items.join(", "));
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const m = thought.metadata;
  const date = new Date(thought.created_at).toLocaleDateString();
  const typeColor = TYPE_COLORS[m.type] || "bg-amber/10 text-amber";
  const isLong = thought.content.length > 300;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: { content?: string; metadata?: Partial<ThoughtMetadata> } = {};
      if (editContent !== thought.content) {
        updates.content = editContent;
      }
      const newMeta: Partial<ThoughtMetadata> = {
        type: editType,
        topics: editTopics.split(",").map((s) => s.trim()).filter(Boolean),
        people: editPeople.split(",").map((s) => s.trim()).filter(Boolean),
        action_items: editActions.split(",").map((s) => s.trim()).filter(Boolean),
      };
      updates.metadata = newMeta;
      await onSave(updates);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-surface border border-amber/30 rounded p-3 space-y-2">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text-primary focus:border-amber/50 focus:outline-none resize-y"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-text-muted text-xs block mb-1">type</label>
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value as ThoughtMetadata["type"])}
              className="w-full bg-bg border border-border rounded px-2 py-1 text-text-secondary focus:border-amber/50 focus:outline-none"
            >
              <option value="observation">observation</option>
              <option value="task">task</option>
              <option value="idea">idea</option>
              <option value="reference">reference</option>
              <option value="person_note">person_note</option>
            </select>
          </div>
          <div>
            <label className="text-text-muted text-xs block mb-1">topics (comma-separated)</label>
            <input
              type="text"
              value={editTopics}
              onChange={(e) => setEditTopics(e.target.value)}
              className="w-full bg-bg border border-border rounded px-2 py-1 text-text-secondary focus:border-amber/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted text-xs block mb-1">people (comma-separated)</label>
            <input
              type="text"
              value={editPeople}
              onChange={(e) => setEditPeople(e.target.value)}
              className="w-full bg-bg border border-border rounded px-2 py-1 text-text-secondary focus:border-amber/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-text-muted text-xs block mb-1">actions (comma-separated)</label>
            <input
              type="text"
              value={editActions}
              onChange={(e) => setEditActions(e.target.value)}
              className="w-full bg-bg border border-border rounded px-2 py-1 text-text-secondary focus:border-amber/50 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancelEdit}
            className="px-3 py-1 text-xs text-text-muted hover:text-text-secondary"
          >
            cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 text-xs border border-amber/30 text-amber rounded hover:bg-amber/10 disabled:opacity-50"
          >
            {saving ? "saving..." : "save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded p-3 hover:border-border-hover transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-text-primary whitespace-pre-wrap break-words">
            {isLong && !expanded ? thought.content.slice(0, 300) + "..." : thought.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-text-muted text-xs mt-1 hover:text-text-secondary"
            >
              {expanded ? "show less" : "show more"}
            </button>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="px-2 py-0.5 text-xs text-text-muted hover:text-amber"
          >
            edit
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-0.5 text-xs text-text-muted hover:text-red-400"
          >
            del
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span className={`px-2 py-0.5 rounded text-xs ${typeColor}`}>
          {m.type}
        </span>
        {m.topics.map((t) => (
          <span key={t} className="px-2 py-0.5 rounded text-xs bg-amber/10 text-amber/70">
            {t}
          </span>
        ))}
        {m.people.map((p) => (
          <span key={p} className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400/70">
            @{p}
          </span>
        ))}
        {m.action_items.length > 0 && (
          <span className="text-xs text-text-muted">
            {m.action_items.length} action{m.action_items.length > 1 ? "s" : ""}
          </span>
        )}
        <span className="text-xs text-text-muted ml-auto">{date}</span>
        <span className="text-xs text-text-muted/50">{m.source}</span>
      </div>
    </div>
  );
}
