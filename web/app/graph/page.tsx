import { auth } from "@/auth";
import { redirect } from "next/navigation";
import GraphView from "@/components/GraphView";

export const metadata = { title: "Graph — Digital Brain" };

export default async function GraphPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <GraphView />;
}
