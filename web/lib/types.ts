export interface ThoughtMetadata {
  type: "observation" | "task" | "idea" | "reference" | "person_note";
  topics: string[];
  people: string[];
  action_items: string[];
  dates_mentioned: string[];
  source: "web" | "mcp";
}

export interface Thought {
  id: string;
  content: string;
  metadata: ThoughtMetadata;
  created_at: string;
}

export interface ThoughtListResponse {
  data: Thought[];
  count: number;
  page: number;
  pageSize: number;
}

export interface StatsResponse {
  total: number;
  dateRange: { earliest: string; latest: string } | null;
  byType: Record<string, number>;
  topTopics: [string, number][];
  topPeople: [string, number][];
}
