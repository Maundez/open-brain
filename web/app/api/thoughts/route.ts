import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getEmbedding, extractMetadata } from "@/lib/metadata";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(params.get("pageSize") || "20")));
  const type = params.get("type");
  const topic = params.get("topic");
  const person = params.get("person");
  const q = params.get("q");
  const mode = params.get("mode") || "text";

  // Semantic search path
  if (q && mode === "semantic") {
    try {
      const queryEmbedding = await getEmbedding(q);
      const { data, error } = await getSupabase().rpc("match_thoughts", {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: pageSize,
        filter: {},
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Post-filter by type/topic/person if provided
      let results = data || [];
      if (type) {
        results = results.filter((t: { metadata: Record<string, unknown> }) => t.metadata?.type === type);
      }
      if (topic) {
        results = results.filter((t: { metadata: Record<string, unknown> }) =>
          Array.isArray(t.metadata?.topics) && (t.metadata.topics as string[]).includes(topic)
        );
      }
      if (person) {
        results = results.filter((t: { metadata: Record<string, unknown> }) =>
          Array.isArray(t.metadata?.people) && (t.metadata.people as string[]).includes(person)
        );
      }

      return NextResponse.json({
        data: results,
        count: results.length,
        page: 1,
        pageSize,
      });
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 }
      );
    }
  }

  // Text search / list path
  let query = getSupabase()
    .from("thoughts")
    .select("id, content, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (type) query = query.contains("metadata", { type });
  if (topic) query = query.contains("metadata", { topics: [topic] });
  if (person) query = query.contains("metadata", { people: [person] });
  if (q) query = query.ilike("content", `%${q}%`);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    count: count || 0,
    page,
    pageSize,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const [embedding, metadata] = await Promise.all([
      getEmbedding(content),
      extractMetadata(content),
    ]);

    const { data, error } = await getSupabase()
      .from("thoughts")
      .insert({
        content,
        embedding,
        metadata: { ...metadata, source: "web" },
      })
      .select("id, content, metadata, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
