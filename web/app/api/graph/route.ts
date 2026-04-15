import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabase } from "@/lib/supabase";
import { buildGraph } from "@/lib/graph";

export async function GET() {
  // Explicit session validation per NF-10 (middleware also protects this route)
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("thoughts")
    .select("id, content, metadata, created_at") // Never include 'embedding'
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const graph = buildGraph(data ?? []);

  // Phase 2 extension point:
  // const semanticEdges = await buildSemanticEdges(data ?? []);
  // graph.edges.push(...semanticEdges);

  return NextResponse.json(graph);
}
