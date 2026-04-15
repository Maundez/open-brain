"use client";

import type { GraphNode } from "@/lib/graph";
import { typeColourMap } from "@/lib/graph";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  node: GraphNode | null;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NodeDetail({ node, onDismiss }: Props) {
  if (!node) return null;

  const colour = typeColourMap[node.type] ?? "#6B7280";

  return (
    <>
      {/* Backdrop — clicking it dismisses */}
      <div
        className="fixed inset-0 z-20"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="complementary"
        aria-label="Thought detail"
        className="fixed right-0 top-0 bottom-0 z-30 w-80 bg-surface border-l border-border flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: colour, color: "#0a0a0a" }}
          >
            {node.type}
          </span>
          <button
            aria-label="Close detail panel"
            onClick={onDismiss}
            className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Full content */}
          <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
            {node.content}
          </p>

          {/* Topics */}
          {node.topics.length > 0 && (
            <div>
              <span className="text-text-muted text-xs mb-1.5 block">
                Topics
              </span>
              <div className="flex flex-wrap gap-1.5">
                {node.topics.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-xs bg-amber/10 text-amber border border-amber/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* People */}
          {node.people.length > 0 && (
            <div>
              <span className="text-text-muted text-xs mb-1.5 block">
                People
              </span>
              <div className="flex flex-wrap gap-1.5">
                {node.people.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded text-xs bg-surface border border-border text-text-secondary"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <span className="text-text-muted text-xs">Captured</span>
            <p className="text-text-secondary text-xs mt-0.5">
              {formatDate(node.createdAt)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0">
          <button
            onClick={() =>
              window.open(`/?highlight=${node.id}`, "_blank", "noopener")
            }
            className="w-full text-xs border border-border hover:border-amber text-text-secondary hover:text-amber rounded px-3 py-2 transition-colors"
          >
            View in list ↗
          </button>
        </div>
      </aside>
    </>
  );
}
