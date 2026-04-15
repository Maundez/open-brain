import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getEmbedding } from "@/lib/metadata";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await getSupabase()
    .from("thoughts")
    .select("id, content, metadata, created_at")
    .eq("id", params.id)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { content, metadata } = body;

    // Fetch existing thought to compare
    const { data: existing, error: fetchErr } = await getSupabase()
      .from("thoughts")
      .select("content, metadata")
      .eq("id", params.id)
      .single();

    if (fetchErr) {
      const status = fetchErr.code === "PGRST116" ? 404 : 500;
      return NextResponse.json({ error: fetchErr.message }, { status });
    }

    const update: Record<string, unknown> = {};

    // If content changed, regenerate embedding
    if (content && content !== existing.content) {
      update.content = content;
      update.embedding = await getEmbedding(content);
    }

    // Merge metadata if provided
    if (metadata) {
      update.metadata = { ...existing.metadata, ...metadata };
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("thoughts")
      .update(update)
      .eq("id", params.id)
      .select("id, content, metadata, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await getSupabase()
    .from("thoughts")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
