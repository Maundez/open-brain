import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { count } = await getSupabase()
    .from("thoughts")
    .select("*", { count: "exact", head: true });

  const { data } = await getSupabase()
    .from("thoughts")
    .select("metadata, created_at")
    .order("created_at", { ascending: false });

  const types: Record<string, number> = {};
  const topics: Record<string, number> = {};
  const people: Record<string, number> = {};

  for (const r of data || []) {
    const m = (r.metadata || {}) as Record<string, unknown>;
    if (m.type) types[m.type as string] = (types[m.type as string] || 0) + 1;
    if (Array.isArray(m.topics)) {
      for (const t of m.topics) topics[t as string] = (topics[t as string] || 0) + 1;
    }
    if (Array.isArray(m.people)) {
      for (const p of m.people) people[p as string] = (people[p as string] || 0) + 1;
    }
  }

  const sort = (o: Record<string, number>): [string, number][] =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

  const dateRange =
    data && data.length > 0
      ? {
          earliest: data[data.length - 1].created_at,
          latest: data[0].created_at,
        }
      : null;

  return NextResponse.json(
    {
      total: count || 0,
      dateRange,
      byType: types,
      topTopics: sort(topics),
      topPeople: sort(people),
    },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
