# Open Brain Web App — Graph View Feature Specification

**Project:** Open Brain Web App (`brain.maundez.uk`)
**Feature:** Graph View — `/graph` route
**Document version:** 1.0 | April 2026
**Author:** Stephen Maunder, DTS Solutions Pty Ltd
**Status:** Draft — ready for Claude Code implementation
**Library:** `react-force-graph-2d` (decided — not subject to revision)
**Phase scope:** Phase 1 only — metadata-based edges (shared topics + shared people)

---

## Part A — Non-Functional Specification

This section defines the quality attributes, constraints, and design principles the graph view must satisfy, independent of any specific behaviour.

### A1 · Purpose and Context

The graph view is the final planned feature of the Open Brain web app. It provides a force-directed, Obsidian-style visual map of all captured thoughts, revealing the relationship network that the list view cannot convey. It is a read-only analytical tool — it surfaces patterns and connections; it does not capture new thoughts or edit existing ones.

The feature is implemented as a new route (`/graph`) within the existing Next.js App Router application. It shares the same Supabase backend, authentication layer, and design system as the rest of the app.

### A2 · Design Principles

- **Consistency with existing UI.** The graph view must use the same dark terminal aesthetic (`#0a0a0a` background), amber accent colour, and JetBrains Mono typeface as the rest of the app. No new design language is introduced.
- **Minimal footprint.** The feature adds one route, one API endpoint, and a small number of components. It does not modify existing files beyond adding a navigation link.
- **Phase discipline.** Phase 1 uses only metadata-based edge inference. No semantic similarity (vector) computation is performed. The architecture must make Phase 2 a clean addition, not a refactor.
- **Data sovereignty.** All data flows through the existing Supabase backend. No third-party graph database or external service is introduced. The `embedding` column is never included in graph API queries.
- **Authentication continuity.** The `/graph` route is protected by the same NextAuth.js v5 Microsoft Entra ID session as all other routes.

### A3 · Non-Functional Requirements

| ID | Category | Requirement | Rationale |
|----|----------|-------------|-----------|
| NF-01 | Performance | The graph must render all current thoughts (~240 nodes) within 3 seconds of page load, including the API call to `/api/graph`. | Client-side graph construction at this scale is instant. |
| NF-02 | Performance | The `/api/graph` route must respond within 1 second under normal load (single user, LAN or Cloudflare Tunnel). | Single-user, self-hosted system. Heavy optimisation not required. |
| NF-03 | Scalability | The implementation must not degrade noticeably up to 500 thoughts without architectural change. At 500+ thoughts, server-side edge computation should be considered. | Phase 1 edge inference is O(n²) worst case; acceptable client-side up to ~500 nodes. |
| NF-04 | Scalability | The Supabase query in `/api/graph` must never `SELECT` the `embedding` column. Only `id`, `content`, `metadata`, and `created_at` may be retrieved. | The embedding vector is large and causes unnecessary data transfer. Hard project constraint. |
| NF-05 | Reliability | If the `/api/graph` call fails, the graph page must display a clear error state rather than a blank canvas or infinite spinner. | Silent failures are worse than visible errors on a personal knowledge tool. |
| NF-06 | Maintainability | All graph logic (edge inference, data transformation) must be isolated in `lib/graph.ts`. No graph computation logic in components or API routes. | Phase 2 semantic edges will extend `lib/graph.ts` without touching components. |
| NF-07 | Maintainability | TypeScript strict mode must be satisfied. No `any` types without an explicit justifying comment. | Existing codebase standard. |
| NF-08 | Compatibility | The feature must work in the latest stable versions of Chrome, Safari (iOS and macOS), and Firefox. Canvas rendering via `react-force-graph-2d` must not require WebGL. | Stephen accesses the app from desktop (Chrome) and iPhone (Safari). `react-force-graph-2d` uses Canvas 2D by default. |
| NF-09 | Accessibility | The graph canvas is exempt from WCAG keyboard navigation requirements. However, surrounding UI controls (filters, search, node detail panel) must be keyboard-accessible with sufficient colour contrast. | Graph canvas interaction is inherently pointer-based. Surrounding UI can and must be accessible. |
| NF-10 | Security | The `/api/graph` route must validate the session using the existing NextAuth.js `getServerSession` pattern before returning any data. | No unauthenticated data exposure. The route must not be a gap in the auth boundary. |
| NF-11 | Visual design | Node colour is determined by thought type only: `observation` = amber (`#F59E0B`), `task` = blue (`#3B82F6`), `idea` = green (`#10B981`), `reference` = grey (`#6B7280`), `person_note` = purple (`#8B5CF6`). Unrecognised types default to grey. | Consistent with existing ThoughtCard type badge colours in the list view. |
| NF-12 | Visual design | Graph background must be `#0a0a0a`. Edge lines at low opacity (~0.3). Nodes must have a subtle glow effect consistent with the terminal aesthetic. | Design consistency with the list view. |
| NF-13 | Bundle size | `react-force-graph-2d` must be dynamically imported (`Next.js dynamic()` with `ssr: false`) to prevent SSR errors and avoid bloating the initial page bundle. | `react-force-graph-2d` uses browser APIs (Canvas, `requestAnimationFrame`) incompatible with SSR. |

### A4 · Constraints

These are fixed — not open to interpretation during Phase 1 implementation:

- **Graph rendering library:** `react-force-graph-2d`. Do not substitute D3-force, Cytoscape, or any other library.
- **Phase 1 scope:** edges inferred from shared topics and shared people in the `metadata` JSONB field only. No vector similarity. No temporal proximity. No manual linking.
- **No new database tables:** Phase 1 requires no schema changes. The `thoughts` table and `match_thoughts` RPC are the only Supabase objects in scope.
- **No write operations:** the graph view is entirely read-only.
- **Deployment target:** existing Docker container on the GMKtec NUC, exposed at `brain.maundez.uk`. No Vercel. No separate container.

### A5 · Out of Scope (Phase 1)

Do not build any of the following in Phase 1:

- Semantic similarity edges (vector-based, using `match_thoughts` RPC)
- `thought_edges` caching table in Supabase
- Scheduled or triggered edge pre-computation
- 3D graph rendering
- Graph clustering or community detection algorithms
- Export of graph as image or data file
- Editing or deleting thoughts from the graph view
- SharePoint integration (separate project — DTS Wiki)

---

## Part B — Functional Specification

### B1 · Feature Overview

The graph view is an interactive, force-directed visualisation of all thoughts stored in the Open Brain. It is accessible via a 'Graph' navigation link from anywhere in the app and renders at the `/graph` route.

In Phase 1, two thoughts are connected if and only if they share at least one topic tag or at least one person name in their metadata. Edges have a type (`topic` or `person`) and a weight (count of shared items). A thought with no shared metadata with any other thought appears as an isolated node.

### B2 · New Files

The following files must be created. No existing files are modified except for adding a navigation link to the existing nav component.

| File path | Purpose |
|-----------|---------|
| `app/graph/page.tsx` | Next.js App Router page for the `/graph` route. Protected by auth. Fetches graph data and renders the layout shell. |
| `app/api/graph/route.ts` | GET endpoint returning `{ nodes, edges }` JSON. Validates session, queries Supabase (no `embedding` column), calls `lib/graph.ts` to build the graph. |
| `components/GraphView.tsx` | Main canvas component. Dynamically imports `react-force-graph-2d`. Renders the force-directed graph. Handles node hover and click events. |
| `components/GraphControls.tsx` | Filter and display controls panel. Allows filtering by type, topic, person. Includes zoom controls and a legend. |
| `components/NodeDetail.tsx` | Thought detail panel on node click. Shows full content, type badge, topics, people, date. Includes a 'View in list' link. |
| `lib/graph.ts` | Pure functions: `buildNodes()`, `buildEdges()`, `filterGraph()`. All edge inference logic lives here. No Supabase calls — operates on data already fetched by the API route. |

### B3 · Data Flow

1. User navigates to `/graph`. NextAuth.js session is validated server-side. If no session, redirect to sign-in.
2. `app/graph/page.tsx` fetches `GET /api/graph` with the session cookie.
3. `app/api/graph/route.ts` validates the session via `getServerSession`. If invalid, returns HTTP 401.
4. The route queries Supabase: `SELECT id, content, metadata, created_at FROM thoughts ORDER BY created_at DESC`. The `embedding` column is never selected.
5. The raw thought rows are passed to `lib/graph.ts` `buildNodes()` and `buildEdges()` to produce the `GraphData` object.
6. The route returns `{ nodes: GraphNode[], edges: GraphEdge[] }` as JSON with HTTP 200.
7. `app/graph/page.tsx` passes the data to `<GraphView />` and `<GraphControls />`.
8. `GraphView` dynamically imports `react-force-graph-2d` (`ssr: false`) and renders the force-directed graph on a Canvas element. The canvas fills the available viewport height minus the nav bar.

### B4 · Data Shapes

All interfaces must be declared in `lib/graph.ts` and exported for use in the API route and components.

```typescript
interface GraphNode {
  id: string;
  label: string;        // First 60 characters of content
  type: string;
  topics: string[];
  people: string[];
  createdAt: string;
  connections: number;  // Degree — number of edges connected to this node
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'topic' | 'person' | 'semantic';  // 'semantic' reserved for Phase 2
  weight: number;       // Count of shared metadata items between source and target
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

### B5 · Edge Inference Rules (`lib/graph.ts`)

The `buildEdges()` function must implement the following rules:

1. For each pair of thoughts (A, B), compute the intersection of their `topics` arrays (case-insensitive comparison).
2. If the intersection is non-empty, create one edge of type `'topic'` with `weight` = intersection size.
3. For each pair of thoughts (A, B), compute the intersection of their `people` arrays (case-insensitive comparison).
4. If the intersection is non-empty, create one edge of type `'person'` with `weight` = intersection size.
5. If a pair shares both topics and people, create two separate edges — one of each type.
6. Edges are undirected. The pair (A, B) and (B, A) produce the same edge. No duplicate edges.
7. A thought with `null` or empty `metadata.topics` and `null` or empty `metadata.people` produces no edges.
8. Self-loops (A → A) are never created.

### B6 · Functional Requirements

| ID | Feature | Description | Acceptance Criteria |
|----|---------|-------------|---------------------|
| FR-01 | Graph rendering | The graph canvas renders all thoughts as nodes, laid out by the force-directed simulation. | Given N thoughts, the canvas displays exactly N nodes on load. |
| FR-02 | Node sizing | Node size (radius) is proportional to connection count (degree). Isolated nodes render at minimum size. Most-connected node renders at maximum size. All others scale linearly. | A thought with 10 connections renders noticeably larger than one with 1 connection. |
| FR-03 | Node colouring | Each node is filled with the colour for its thought type per NF-11. A radial glow of the same colour at ~40% opacity creates the terminal aesthetic. | An `observation` thought renders in amber (`#F59E0B`) without hovering. |
| FR-04 | Edge rendering | Edges render as thin straight lines (1px) at low opacity (0.25–0.35). Topic and person edges are visually identical in Phase 1. | All edges are visible but do not dominate the canvas. |
| FR-05 | Node hover — highlight | When the pointer enters a node, that node and all direct neighbours are highlighted (full opacity). All other nodes and edges fade to ~10% opacity. | Hovering a node causes all non-adjacent nodes to visually recede. |
| FR-06 | Node hover — tooltip | While hovering, a tooltip displays the first 80 characters of the thought content and the type badge. | Tooltip appears within 200ms of hover entry. Disappears on pointer exit. |
| FR-07 | Node click — detail panel | Clicking a node opens the `NodeDetail` panel (side drawer or overlay, not page navigation) containing: full content, type badge, all topics, all people, date captured, and a 'View in list' button opening `/?highlight={id}` in a new tab. | Clicking a node causes the NodeDetail panel to appear with correct data. |
| FR-08 | Node click — deselect | Clicking the canvas background or pressing Escape dismisses the NodeDetail panel and restores all nodes to full opacity. | After dismissal, the graph returns to its default all-nodes-visible state. |
| FR-09 | Canvas pan and zoom | User can pan by dragging the canvas background. User can zoom via scroll wheel or pinch gesture. Zoom limits: 0.1× minimum, 8× maximum. | Pan and zoom work on desktop (mouse) and iPhone (touch/pinch). |
| FR-10 | Zoom to fit | A 'Fit graph' button in `GraphControls` resets zoom and pan so all nodes are visible with ~10% padding. | Clicking 'Fit graph' after manual zoom causes all nodes to become visible. |
| FR-11 | Filter by type | `GraphControls` includes a multi-select type filter. Deselected types and their edges are hidden. A 'Show all' button restores all nodes. | Deselecting `task` hides all task nodes and edges exclusively connected to task nodes. |
| FR-12 | Filter by topic | `GraphControls` includes a searchable topic dropdown. Selecting a topic highlights only matching nodes; all others fade to 10% opacity. | Selecting `tax` highlights only thoughts tagged with `tax`. |
| FR-13 | Filter by person | `GraphControls` includes a searchable person dropdown. Selecting a person highlights only matching nodes; all others fade. | Selecting `Stephen` highlights only thoughts mentioning Stephen. |
| FR-14 | Filter reset | A 'Clear filters' button resets all active filters simultaneously and restores the default graph state. | After clicking 'Clear filters', all nodes are visible and no filter is active. |
| FR-15 | Legend | `GraphControls` includes a static legend mapping each thought type to its colour per NF-11. | The legend is visible without interaction. It shows all five type colours with labels. |
| FR-16 | Navigation link | The existing app navigation includes a 'Graph' link routing to `/graph`, styled consistently with the existing list view link. | The Graph link is visible in the nav on all pages. Clicking it navigates without a full page reload. |
| FR-17 | Loading state | While `/api/graph` is in-flight, the canvas area displays a loading indicator consistent with existing app patterns (e.g. pulsing amber dot). | On first load, the user sees a loading indicator rather than a blank canvas. |
| FR-18 | Error state | If `/api/graph` returns non-200 or a network error occurs, the page displays: *'Unable to load graph data. Please refresh the page.'* | Simulating a network failure causes the error message to appear rather than a broken canvas. |
| FR-19 | Empty state | If Supabase returns zero thoughts, the canvas displays: *'No thoughts captured yet. Use the MCP tool to add your first thought.'* | With an empty database, the empty state message is displayed. |
| FR-20 | Responsive layout | The graph canvas fills the full available width and height (minus nav bar height) on all supported screen sizes. `GraphControls` is positioned as a top-right overlay panel, collapsible on mobile. | On an iPhone viewport, the canvas fills the screen and controls are accessible via a toggle button. |

### B7 · `react-force-graph-2d` Configuration

The following props must be set on the `ForceGraph2D` component:

```typescript
<ForceGraph2D
  backgroundColor="#0a0a0a"
  nodeVal={(node) => Math.max(1, node.connections)}
  nodeColor={(node) => typeColourMap[node.type] ?? '#6B7280'}
  nodeCanvasObject={/* custom painter — glow via Canvas 2D shadowBlur + shadowColor */}
  linkColor={() => 'rgba(255,255,255,0.25)'}
  linkWidth={1}
  onNodeHover={(node) => setHoveredNode(node)}
  onNodeClick={(node) => setSelectedNode(node)}
  onBackgroundClick={() => setSelectedNode(null)}
  cooldownTicks={100}
  d3AlphaDecay={0.02}
  d3VelocityDecay={0.3}
  ref={graphRef}  // exposes zoomToFit() for the 'Fit graph' button
/>
```

The type colour map:

```typescript
const typeColourMap: Record<string, string> = {
  observation: '#F59E0B',
  task:        '#3B82F6',
  idea:        '#10B981',
  reference:   '#6B7280',
  person_note: '#8B5CF6',
};
```

### B8 · Phase 2 Extension Points

The following stubs must be present in Phase 1 to make Phase 2 a clean extension:

- `lib/graph.ts` must export a `buildSemanticEdges()` function stub that accepts thought rows and returns an empty array. Phase 2 replaces this stub with the `match_thoughts` RPC call.
- `app/api/graph/route.ts` must include a commented-out block showing where the semantic edges API call would be inserted.
- The `GraphEdge` type already includes `'semantic'` as a valid value for the `type` field (see B4), so Phase 2 requires no type changes.

---

## Appendix — Claude Code Session Notes

Read this before writing any code.

### Project context

- **Repo:** `Maundez/open-brain-ui`
- **Framework:** Next.js App Router (`app/` directory — not Pages Router)
- **Live URL:** `https://brain.maundez.uk`
- **Infrastructure:** GMKtec NUC, Docker, Nginx Proxy Manager, Cloudflare DNS

### Hard constraints

- **Do not touch `auth.ts`.** It contains `trustHost: true` which is required for NextAuth.js v5 behind a reverse proxy. Removing it breaks all authentication.
- **Do not create a new Supabase client.** Import the existing lazy-initialised client from `lib/supabase.ts`.
- **Never `SELECT` the `embedding` column** from the `thoughts` table. This is a hard project-wide constraint. The column is large and must never appear in graph API queries.
- **Use `react-force-graph-2d` only.** No substitutions.
- **Build Phase 1 only.** Do not implement semantic similarity edges, `thought_edges` table, or any Phase 2 feature.

### Design system

- Background: `#0a0a0a`
- Amber accent: `#F59E0B`
- Monospace font: JetBrains Mono
- Body font: Arial / system-ui
- Styling: Tailwind CSS (configured and in use)

### Authentication pattern

Session is retrieved in API routes using:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### Supabase query pattern

```typescript
const { data, error } = await supabase
  .from('thoughts')
  .select('id, content, metadata, created_at')  // Never include 'embedding'
  .order('created_at', { ascending: false });
```

### Deployment workflow

After implementation and local testing:

```bash
# On Steve-Desktop
git push

# On NUC (192.168.1.50)
git pull
docker build -t open-brain-ui:latest .
docker compose down && docker compose up -d
```

### Claude Code session prompt

Use this prompt to open the implementation session:

> You are working in the Next.js App Router project at Maundez/open-brain-ui. The app is live at brain.maundez.uk on a self-hosted GMKtec NUC. Auth is NextAuth.js v5 with Microsoft Entra ID — do not touch auth.ts. The Supabase client is in lib/supabase.ts — do not create a new one. Never SELECT the embedding column from the thoughts table. Read docs/graph-view-spec.md in full before writing any code. Summarise what you are going to build and confirm you understand the constraints. Do not write any code until I confirm your summary is correct.
