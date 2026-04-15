import type { Thought } from "@/lib/types";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface GraphNode {
  id: string;
  label: string; // First 60 characters of content
  content: string; // Full thought content
  type: string;
  topics: string[];
  people: string[];
  createdAt: string;
  connections: number; // Degree — number of edges connected to this node
}

export interface GraphEdge {
  source: string;
  target: string;
  type: "topic" | "person" | "semantic"; // 'semantic' reserved for Phase 2
  weight: number; // Count of shared metadata items between source and target
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphFilters {
  types: string[]; // Only nodes whose type is in this set are kept
  topic: string | null; // Highlight filter — applied visually, not structurally
  person: string | null; // Highlight filter — applied visually, not structurally
  minConnections: number; // Structural filter — hides nodes below this degree
}

// ---------------------------------------------------------------------------
// Colour map — exported so GraphView and GraphControls share the same source
// ---------------------------------------------------------------------------

export const typeColourMap: Record<string, string> = {
  observation: "#F59E0B",
  task: "#3B82F6",
  idea: "#10B981",
  reference: "#6B7280",
  person_note: "#8B5CF6",
};

export const ALL_TYPES = [
  "observation",
  "task",
  "idea",
  "reference",
  "person_note",
] as const;

// ---------------------------------------------------------------------------
// Edge inference
// ---------------------------------------------------------------------------

function intersectLower(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((s) => setB.has(s.toLowerCase()));
}

export function buildEdges(thoughts: Thought[]): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (let i = 0; i < thoughts.length; i++) {
    for (let j = i + 1; j < thoughts.length; j++) {
      const a = thoughts[i];
      const b = thoughts[j];

      const aTopics = a.metadata?.topics ?? [];
      const bTopics = b.metadata?.topics ?? [];
      const aPeople = a.metadata?.people ?? [];
      const bPeople = b.metadata?.people ?? [];

      const sharedTopics = intersectLower(aTopics, bTopics);
      if (sharedTopics.length > 0) {
        edges.push({
          source: a.id,
          target: b.id,
          type: "topic",
          weight: sharedTopics.length,
        });
      }

      const sharedPeople = intersectLower(aPeople, bPeople);
      if (sharedPeople.length > 0) {
        edges.push({
          source: a.id,
          target: b.id,
          type: "person",
          weight: sharedPeople.length,
        });
      }
    }
  }

  return edges;
}

// ---------------------------------------------------------------------------
// Node construction
// ---------------------------------------------------------------------------

export function buildNodes(
  thoughts: Thought[],
  degreeMap: Map<string, number>
): GraphNode[] {
  return thoughts.map((t) => ({
    id: t.id,
    label: t.content.slice(0, 60),
    content: t.content,
    type: t.metadata?.type ?? "observation",
    topics: t.metadata?.topics ?? [],
    people: t.metadata?.people ?? [],
    createdAt: t.created_at,
    connections: degreeMap.get(t.id) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Main builder — called by the API route
// ---------------------------------------------------------------------------

export function buildGraph(thoughts: Thought[]): GraphData {
  const edges = buildEdges(thoughts);

  // Build degree map
  const degreeMap = new Map<string, number>();
  for (const edge of edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
  }

  const nodes = buildNodes(thoughts, degreeMap);
  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Type filter — removes nodes of deselected types and their exclusive edges
// ---------------------------------------------------------------------------

export function filterGraph(data: GraphData, filters: GraphFilters): GraphData {
  const { types, minConnections } = filters;

  if (types.length === 0) {
    return { nodes: [], edges: [] };
  }

  const keepSet = new Set(
    data.nodes
      .filter((n) => types.includes(n.type) && n.connections >= minConnections)
      .map((n) => n.id)
  );

  const nodes = data.nodes.filter((n) => keepSet.has(n.id));
  const edges = data.edges.filter(
    (e) => keepSet.has(e.source) && keepSet.has(e.target)
  );

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Phase 2 stub — replace body with match_thoughts RPC call
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buildSemanticEdges(_thoughts: Thought[]): GraphEdge[] {
  // Phase 2: call match_thoughts RPC here and return semantic edges.
  return [];
}
