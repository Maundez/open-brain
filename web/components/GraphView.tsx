"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import type { ForceGraphMethods, NodeObject, LinkObject } from "react-force-graph-2d";
import type { GraphData, GraphNode, GraphEdge, GraphFilters } from "@/lib/graph";
import { filterGraph, typeColourMap, ALL_TYPES } from "@/lib/graph";
import GraphControls from "@/components/GraphControls";
import NodeDetail from "@/components/NodeDetail";

// Dynamic import — react-force-graph-2d uses Canvas APIs incompatible with SSR.
// Cast to unknown first then to a permissive function type because Next.js
// dynamic() returns a ComponentType that drops the generic ref overload.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
}) as unknown as AnyComponent;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FGNode = NodeObject<GraphNode>;
type FGLink = LinkObject<GraphNode, GraphEdge>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_NODE_RADIUS = 4;
const MAX_NODE_RADIUS = 18;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GraphView() {
  // --- Data state ---
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Interaction state ---
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<FGNode | null>(null);

  // --- Filter state ---
  const [filters, setFilters] = useState<GraphFilters>({
    types: [...ALL_TYPES],
    topic: null,
    person: null,
  });

  // --- Canvas sizing ---
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // --- Graph ref (for zoomToFit) ---
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);

  // --- Tooltip position ---
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // ---------------------------------------------------------------------------
  // Fetch graph data on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetch("/api/graph")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<GraphData>;
      })
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load graph data. Please refresh the page.");
        setLoading(false);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // Canvas sizing via ResizeObserver
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ---------------------------------------------------------------------------
  // Escape key dismisses selected node
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedNode(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ---------------------------------------------------------------------------
  // Zoom to fit after initial engine stop
  // ---------------------------------------------------------------------------

  const handleEngineStop = useCallback(() => {
    graphRef.current?.zoomToFit(400, 40);
  }, []);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  // Apply type filter (structural — removes nodes + edges)
  const filteredData = useMemo(() => {
    if (!graphData) return { nodes: [], edges: [] };
    return filterGraph(graphData, filters);
  }, [graphData, filters]);

  // Build neighbour set for hover highlight
  const neighbourIds = useMemo<Set<string>>(() => {
    if (!hoveredNode || !filteredData) return new Set();
    const id = (hoveredNode as FGNode & GraphNode).id;
    const set = new Set<string>();
    for (const edge of filteredData.edges) {
      const src =
        typeof edge.source === "object"
          ? (edge.source as FGNode & { id: string }).id
          : (edge.source as string);
      const tgt =
        typeof edge.target === "object"
          ? (edge.target as FGNode & { id: string }).id
          : (edge.target as string);
      if (src === id) set.add(tgt);
      if (tgt === id) set.add(src);
    }
    return set;
  }, [hoveredNode, filteredData]);

  // Compute max connections for node sizing
  const maxConnections = useMemo(() => {
    if (!filteredData.nodes.length) return 1;
    return Math.max(1, ...filteredData.nodes.map((n) => (n as GraphNode).connections));
  }, [filteredData]);

  // Derive allTopics and allPeople for controls
  const { allTopics, allPeople } = useMemo(() => {
    if (!graphData) return { allTopics: [], allPeople: [] };
    const topicsSet = new Set<string>();
    const peopleSet = new Set<string>();
    for (const node of graphData.nodes) {
      node.topics.forEach((t) => topicsSet.add(t));
      node.people.forEach((p) => peopleSet.add(p));
    }
    return {
      allTopics: Array.from(topicsSet).sort(),
      allPeople: Array.from(peopleSet).sort(),
    };
  }, [graphData]);

  // Shape expected by react-force-graph-2d: { nodes, links }
  const fgData = useMemo(
    () => ({
      nodes: filteredData.nodes as FGNode[],
      links: filteredData.edges as FGLink[],
    }),
    [filteredData]
  );

  // ---------------------------------------------------------------------------
  // Node canvas painter
  // ---------------------------------------------------------------------------

  const paintNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const gn = node as FGNode & GraphNode;
      const x = node.x ?? 0;
      const y = node.y ?? 0;

      // Radius scales with connections
      const t = maxConnections > 1 ? gn.connections / maxConnections : 0;
      const radius = MIN_NODE_RADIUS + t * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);

      const colour = typeColourMap[gn.type] ?? "#6B7280";
      const hovId = hoveredNode
        ? (hoveredNode as FGNode & GraphNode).id
        : null;
      const isHovered = hovId === gn.id;
      const isNeighbour = neighbourIds.has(gn.id);
      const highlightActive = hovId !== null;

      // Topic/person highlight takes precedence over hover highlight
      const topicMatch =
        filters.topic ? gn.topics.some(
          (t2) => t2.toLowerCase() === filters.topic!.toLowerCase()
        ) : null;
      const personMatch =
        filters.person ? gn.people.some(
          (p) => p.toLowerCase() === filters.person!.toLowerCase()
        ) : null;
      const highlightFilterActive = filters.topic !== null || filters.person !== null;
      const matchesHighlight =
        (filters.topic !== null && topicMatch) ||
        (filters.person !== null && personMatch);

      let opacity = 1;
      if (highlightFilterActive && !matchesHighlight) {
        opacity = 0.1;
      } else if (highlightActive && !isHovered && !isNeighbour) {
        opacity = 0.1;
      }

      ctx.save();
      ctx.globalAlpha = opacity;

      // Glow
      ctx.shadowColor = colour;
      ctx.shadowBlur = isHovered ? 16 : 8;

      // Filled circle
      ctx.beginPath();
      ctx.arc(x, y, radius / globalScale, 0, 2 * Math.PI);
      ctx.fillStyle = colour;
      ctx.fill();

      // Subtle ring on hover
      if (isHovered) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    },
    [hoveredNode, neighbourIds, maxConnections, filters.topic, filters.person]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleNodeHover = useCallback((node: FGNode | null) => {
    setHoveredNode(node);
  }, []);

  const handleNodeClick = useCallback((node: FGNode) => {
    setSelectedNode(node as FGNode & GraphNode);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleZoomToFit = useCallback(() => {
    graphRef.current?.zoomToFit(400, 40);
  }, []);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
          <span className="text-text-secondary text-sm">loading graph…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <p className="text-text-secondary text-sm">{error}</p>
      </div>
    );
  }

  if (graphData && graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <p className="text-text-secondary text-sm">
          No thoughts captured yet. Use the MCP tool to add your first thought.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tooltip content
  // ---------------------------------------------------------------------------

  const tooltipNode = hoveredNode as (FGNode & GraphNode) | null;

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative" style={{ height: "calc(100vh - 120px)" }}>
      {/* Canvas wrapper */}
      <div
        ref={wrapperRef}
        className="absolute inset-0 overflow-hidden"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={fgData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#0a0a0a"
          nodeVal={(node: FGNode) => Math.max(1, (node as FGNode & GraphNode).connections)}
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => "replace"}
          linkColor={() => "rgba(255,255,255,0.25)"}
          linkWidth={1}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onEngineStop={handleEngineStop}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          minZoom={0.1}
          maxZoom={8}
          enableNodeDrag
          showPointerCursor={!!hoveredNode}
        />
      </div>

      {/* Hover tooltip */}
      {tooltipNode && (
        <div
          className="pointer-events-none absolute z-20 max-w-[280px] bg-surface border border-border rounded px-3 py-2 shadow-lg"
          style={{
            left: mousePos.x + 14,
            top: mousePos.y - 10,
            transform:
              mousePos.x > dimensions.width * 0.7
                ? "translateX(-100%)"
                : undefined,
          }}
        >
          <span
            className="text-xs font-bold mr-2 px-1.5 py-0.5 rounded"
            style={{
              background: typeColourMap[tooltipNode.type] ?? "#6B7280",
              color: "#0a0a0a",
            }}
          >
            {tooltipNode.type}
          </span>
          <p className="text-text-primary text-xs mt-1 leading-relaxed">
            {tooltipNode.label || tooltipNode.content?.slice(0, 80)}
          </p>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 z-10">
        <GraphControls
          filters={filters}
          setFilters={setFilters}
          onZoomToFit={handleZoomToFit}
          allTopics={allTopics}
          allPeople={allPeople}
        />
      </div>

      {/* Node detail panel */}
      <NodeDetail
        node={selectedNode}
        onDismiss={() => setSelectedNode(null)}
      />
    </div>
  );
}
