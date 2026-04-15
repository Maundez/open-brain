"use client";

import { useEffect, useState } from "react";
import { StatsResponse } from "@/lib/types";

interface StatsPanelProps {
  show: boolean;
  onClose: () => void;
}

export default function StatsPanel({ show, onClose }: StatsPanelProps) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-t-lg sm:rounded-lg p-4 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-amber font-bold text-sm">Stats</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary text-xs"
          >
            close
          </button>
        </div>

        {loading && <p className="text-text-muted text-xs">loading...</p>}

        {stats && (
          <div className="space-y-4 text-xs">
            <div className="flex gap-4">
              <div>
                <span className="text-text-muted">total</span>
                <p className="text-amber text-lg font-bold">{stats.total}</p>
              </div>
              {stats.dateRange && (
                <div>
                  <span className="text-text-muted">date range</span>
                  <p className="text-text-primary">
                    {new Date(stats.dateRange.earliest).toLocaleDateString()}
                    {" \u2192 "}
                    {new Date(stats.dateRange.latest).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-text-muted mb-1">by type</h3>
              <div className="space-y-1">
                {Object.entries(stats.byType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div
                        className="h-1.5 bg-amber/60 rounded"
                        style={{
                          width: `${(count / stats.total) * 100}%`,
                          minWidth: "4px",
                        }}
                      />
                      <span className="text-text-secondary">{type}</span>
                      <span className="text-text-muted ml-auto">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {stats.topTopics.length > 0 && (
              <div>
                <h3 className="text-text-muted mb-1">top topics</h3>
                <div className="flex flex-wrap gap-1">
                  {stats.topTopics.map(([topic, count]) => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 rounded bg-amber/10 text-amber/70"
                    >
                      {topic} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {stats.topPeople.length > 0 && (
              <div>
                <h3 className="text-text-muted mb-1">top people</h3>
                <div className="flex flex-wrap gap-1">
                  {stats.topPeople.map(([person, count]) => (
                    <span
                      key={person}
                      className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400/70"
                    >
                      @{person} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
