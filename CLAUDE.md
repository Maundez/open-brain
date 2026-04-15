# Open Brain — MCP Server

Open Brain is a personal knowledge capture system. It exposes four MCP tools via a Supabase Edge Function so that AI agents (Claude Desktop, Claude.ai) can read and write thoughts to a Supabase PostgreSQL database.

The [web/](web/) subdirectory is a separate Next.js human-facing app with its own `web/CLAUDE.md`. Do not touch it unless the session is explicitly about the web app.

---

## Project layout

```
supabase/
  functions/
    open-brain-mcp/
      index.ts        ← MCP server — single entrypoint, read this first
      deno.json       ← import map (pinned dependency versions)
  config.toml         ← Supabase local dev config
web/                  ← Next.js app (separate concern)
CLAUDE.md             ← this file
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Deno v2 (Supabase Edge Runtime) |
| Web framework | Hono v4.9.2 |
| MCP SDK | @modelcontextprotocol/sdk v1.24.3 |
| MCP transport | @hono/mcp v0.1.1 (StreamableHTTPTransport) |
| Schema validation | Zod v4.1.13 |
| Supabase client | @supabase/supabase-js v2.47.10 |

All dependency versions are pinned in [supabase/functions/open-brain-mcp/deno.json](supabase/functions/open-brain-mcp/deno.json).

---

## Supabase project

- Project ID: `open-brain`
- Project URL: `https://iwyofenfguyrzgqwytse.supabase.co`
- MCP endpoint: `https://iwyofenfguyrzgqwytse.supabase.co/functions/v1/open-brain-mcp`
- Edge function name: `open-brain-mcp`
- Entrypoint: `supabase/functions/open-brain-mcp/index.ts`
- JWT verification: enabled (`verify_jwt = true` in config.toml)

**Local dev ports** (via `supabase start`):

| Service | Port |
|---|---|
| API | 54321 |
| DB | 54322 |
| Studio | 54323 |

Database: PostgreSQL 17

---

## Database

### Table: `thoughts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `content` | text | The thought text |
| `embedding` | vector | **Never SELECT this column** |
| `metadata` | jsonb | Auto-extracted fields (see below) |
| `created_at` | timestamp | |

### `metadata` JSONB fields

| Field | Type | Description |
|---|---|---|
| `type` | string | `observation`, `task`, `idea`, `reference`, or `person_note` |
| `topics` | string[] | 1–3 short topic tags |
| `people` | string[] | People mentioned |
| `action_items` | string[] | Implied to-dos |
| `dates_mentioned` | string[] | Dates in YYYY-MM-DD format |
| `source` | string | Always `"mcp"` when captured via MCP |

### RPC function: `match_thoughts`

Vector similarity search. Called by the `search_thoughts` tool with:
- `query_embedding` — float[] from OpenRouter embeddings
- `match_threshold` — float (default 0.5)
- `match_count` — int (default 10)
- `filter` — jsonb (currently passed as `{}`)

**Do not modify `match_thoughts`.**

---

## MCP tools

All four tools are registered in `index.ts`. Read the file before modifying any tool.

| Tool | Description |
|---|---|
| `capture_thought` | Inserts a new thought; generates embedding + extracts metadata automatically |
| `list_thoughts` | Returns paginated thoughts with optional filters (type, topic, person, days) |
| `search_thoughts` | Vector similarity search via `match_thoughts` RPC |
| `thought_stats` | Aggregated counts, top topics, top people |

### SELECT discipline

**Never include the `embedding` column in any SELECT.** It is a large vector and will bloat responses.

- Correct: `.select("id, content, metadata, created_at")`
- Correct count pattern (used in `thought_stats`): `.select("*", { count: "exact", head: true })` — `head: true` makes this a HEAD request; no rows are returned, only the count.
- Wrong: `.select("*")` without `head: true` on the `thoughts` table

---

## Authentication

Two-layer auth:

1. **Supabase JWT** — `verify_jwt = true` in config.toml. Supabase validates the JWT before the function receives the request.
2. **Custom access key** — The Hono app checks every request for `MCP_ACCESS_KEY` via:
   - HTTP header: `x-brain-key`
   - URL query parameter: `?key=`
   - Returns 401 if missing or incorrect.

Claude.ai connects via the MCP connector UI with the full endpoint URL plus `?key=<value>`. The key value is never committed to code.

---

## AI services (via OpenRouter)

Both AI calls go through OpenRouter — never directly to OpenAI.

| Purpose | Model | Endpoint |
|---|---|---|
| Embeddings | `openai/text-embedding-3-small` | `POST /embeddings` |
| Metadata extraction | `openai/gpt-4o-mini` (JSON mode) | `POST /chat/completions` |

Base URL: `https://openrouter.ai/api/v1`

---

## Environment variables

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `MCP_ACCESS_KEY` | Custom auth key for MCP access |

For local dev, set these in `supabase/functions/.env` (gitignored).

---

## VS Code setup

The Deno extension (`denoland.vscode-deno`) is scoped to `supabase/functions/`. TypeScript formatter is set to the Deno extension. Deno lint is enabled.

---

## Rules for every session

1. **Read `index.ts` before making any changes.** The entire server is in one file.
2. **Never modify the `thoughts` table schema or the `match_thoughts` RPC function.**
3. **Never include the `embedding` column in SELECT queries.**
4. **All AI service calls go via OpenRouter** (`https://openrouter.ai/api/v1`), not direct provider APIs.
5. **The `web/` directory is a separate project.** Do not touch it unless the session is explicitly about the web app.
6. **Never commit secrets.** `MCP_ACCESS_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENROUTER_API_KEY` must stay out of version control.

---

## Common commands

```bash
# Start local Supabase stack
supabase start

# Serve the edge function locally
supabase functions serve open-brain-mcp --env-file supabase/functions/.env

# Deploy to production
supabase functions deploy open-brain-mcp

# View function logs
supabase functions logs open-brain-mcp
```
