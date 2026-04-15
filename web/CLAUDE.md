# Open Brain Web App — Next.js

Human-facing web app for the Open Brain personal knowledge system. Lets Stephen
and Dianne browse, search, add, edit, and delete thoughts stored in Supabase.

## Project context

Open Brain is a two-part system:

| Part                              | Purpose                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------ |
| Open Brain MCP server             | Capture layer — atomic thought capture from any AI session, stored in Supabase |
| **This app (Open Brain web app)** | Query layer — browse, search, visualise, and navigate thoughts in Supabase     |

**Scope:** This app is solely concerned with thoughts stored in Supabase. Content
is LLM-generated from Claude sessions — project notes, decisions, ideas, and
observations. This is not a document management system. Human-produced business
documents live in SharePoint and are managed by a separate project (DTS Wiki).

The MCP server lives in the **parent repo's** `../supabase/functions/open-brain-mcp/`.
Do not conflate the two. This CLAUDE.md covers the web app only.

### Entities whose thoughts are captured in Open Brain

- DTS Solutions Pty Ltd
- DTS Family Trust
- DS & SM Superannuation Fund (SMSF)
- Household (Stephen + Dianne personal, Home Cinema, Medical, Travel)

---

## Deployment status (April 2026)

| Environment                                   | Status                |
| --------------------------------------------- | --------------------- |
| Local (Steve-Desktop, port 3001)              | ✅ Running            |
| Docker image                                  | ✅built      |
| NUC (192.168.1.50, Ubuntu 24.04)              | ✅deployed   |
| Cloudflare Tunnel (brain.dtssolutions.com.au) | ✅ configured |

**Next step:** Dockerise this app and deploy to the NUC. Extract `web/` into a
standalone repo (`open-brain-ui`) at Dockerisation time. Do not deploy to Vercel.

---

## Planned features (not yet built)

These are confirmed next development items — do not treat as out of scope:

1. **Graph view** (`/graph` route) — Obsidian-style relationship visualisation
   using `react-force-graph-2d`. Phase 1: metadata edges (shared topics + people).
   Phase 2: semantic similarity edges via Supabase `match_thoughts` RPC.

---

## Tech stack

| Layer             | Choice                                                        |
| ----------------- | ------------------------------------------------------------- |
| Framework         | Next.js 14.2.35 (App Router)                                  |
| Language          | TypeScript                                                    |
| Styling           | Tailwind CSS v3 + JetBrains Mono font                         |
| Auth              | NextAuth.js v5 (next-auth@beta 5.0.0-beta.30)                 |
| OAuth provider    | Microsoft Entra ID (Azure AD) — single-tenant (DTS Solutions) |
| Database client   | @supabase/supabase-js v2 (server-side only via `server-only`) |
| Deployment target | Docker on GMKtec N95 NUC (192.168.1.50) — not Vercel          |

---

## Project layout

```
web/
  app/
    api/
      auth/
        [...nextauth]/
          route.ts      ← NextAuth route handler (GET + POST)
      stats/
        route.ts        ← /api/stats
      thoughts/
        route.ts        ← /api/thoughts (list, create)
        [id]/
          route.ts      ← /api/thoughts/:id (PATCH, DELETE)
    login/
      page.tsx          ← Custom Microsoft SSO sign-in page
    layout.tsx          ← Root layout (JetBrains Mono, dark theme header)
    page.tsx            ← Main thoughts browser (client component)
    globals.css
  components/           ← UI components (do not modify unless asked)
  lib/
    supabase.ts         ← Supabase server client (do not modify)
    metadata.ts         ← Metadata helpers (do not modify)
    types.ts            ← Shared TypeScript types (do not modify)
  auth.ts               ← NextAuth v5 config — provider, tenant lock, callbacks
  middleware.ts         ← Route protection — redirects unauthenticated → /login
  tailwind.config.ts    ← Colour tokens (see Design system below)
  .env.local.example    ← All required env vars with explanations
  AZURE_SETUP.md        ← Step-by-step Azure portal setup for Stephen
```

---

## Authentication architecture

### How it works

1. `middleware.ts` intercepts every request. If no valid JWT session exists the
   user is redirected to `/login`.
2. `/login` renders a custom sign-in page (dark terminal aesthetic). A single
   "Sign in with Microsoft" button calls `signIn("microsoft-entra-id")`.
3. NextAuth handles the OAuth code flow via `/api/auth/[...nextauth]`.
4. The `signIn` callback in `auth.ts` checks the `tid` (tenant ID) claim in the
   Microsoft id_token. Sign-ins from any tenant other than `AZURE_AD_TENANT_ID`
   return `false` and the user is rejected.
5. On success NextAuth issues a JWT session cookie. All subsequent requests pass
   the middleware check without hitting Azure again.

### Known provider quirks (NextAuth v5 + MicrosoftEntraId)

- **Use `issuer`, not `tenantId`.** The `tenantId` option in `MicrosoftEntraId({})` does not reliably set the tenant-specific endpoint — the provider can fall back to `/common`, which Azure rejects for single-tenant apps. Always set `issuer` explicitly in `auth.ts`:
  ```ts
  issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`;
  ```
- **Callback path is `microsoft-entra-id`, not `azure-ad`.** The Azure redirect URI must be `/api/auth/callback/microsoft-entra-id`. The old `azure-ad` path used by NextAuth v4 is wrong here.

### Tenant locking

The app uses the `tid` OIDC claim — **not** the email domain — to enforce
single-tenant access. This prevents guest accounts on other tenants from
gaining access even if they have an `@dtssolutions.com.au` UPN.

Implementation: `auth.ts` → `callbacks.signIn`.

### Session strategy

JWT (no database adapter). Session state lives in a signed/encrypted cookie.
No Supabase auth tables involved.

---

## Environment variables

| Variable                    | Purpose                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`  | Supabase project URL (public)                                                                    |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server-side only, bypasses RLS                                                |
| `OPENROUTER_API_KEY`        | OpenRouter API key (used server-side for semantic search)                                        |
| `AZURE_AD_CLIENT_ID`        | Azure app registration client ID                                                                 |
| `AZURE_AD_CLIENT_SECRET`    | Azure app registration client secret                                                             |
| `AZURE_AD_TENANT_ID`        | DTS Solutions Directory (tenant) ID                                                              |
| `NEXTAUTH_SECRET`           | Random string for JWT signing (`openssl rand -base64 32`)                                        |
| `NEXTAUTH_URL`              | Canonical base URL (`http://localhost:3001` locally, `https://brain.dtssolutions.com.au` on NUC) |

Copy `.env.local.example` → `.env.local` and fill in values. See `AZURE_SETUP.md`
for how to obtain the Azure values.

---

## Design system

Colours are defined in `tailwind.config.ts`:

| Token            | Hex       | Usage                         |
| ---------------- | --------- | ----------------------------- |
| `bg`             | `#0a0a0a` | Page background               |
| `surface`        | `#141414` | Cards, panels                 |
| `surface-hover`  | `#1a1a1a` | Hover state                   |
| `border`         | `#1e1e1e` | Default borders               |
| `border-hover`   | `#2a2a2a` | Hovered borders               |
| `amber`          | `#f59e0b` | Primary accent (titles, CTAs) |
| `amber-dim`      | `#92600a` | Subdued amber                 |
| `amber-bright`   | `#fbbf24` | Highlighted amber             |
| `text-primary`   | `#e5e5e5` | Body text                     |
| `text-secondary` | `#737373` | Secondary text                |
| `text-muted`     | `#525252` | Muted/placeholder text        |

Font: JetBrains Mono (loaded in `layout.tsx` via `next/font/google`).

---

## Rules for every session

1. **Do not modify** `lib/supabase.ts`, `lib/metadata.ts`, or `lib/types.ts`
   without explicit instruction — these are stable shared dependencies.
2. **Do not add Vercel config** — deployment target is Docker on the NUC (192.168.1.50).
3. **Do not create a new Supabase project or database.**
4. **Do not add SharePoint or Microsoft Graph API integration** — that belongs to
   the DTS Wiki project, which is a separate application with separate storage.
5. **Read `auth.ts` before touching anything auth-related.**
6. **Read `middleware.ts` before changing route protection logic.**
7. The `SUPABASE_SERVICE_ROLE_KEY` and `AZURE_AD_CLIENT_SECRET` must never appear
   in client-side code or be committed to version control.
8. Any new page or route added must be covered by the middleware matcher — check
   `middleware.ts` when adding routes.
9. **Search the Open Brain MCP before starting any session** — architecture
   decisions are captured there. Use: "Before we start, search my Open Brain for
   context on the Open Brain web app project."

---

## Common commands

```bash
# From web/
npm run dev       # Start dev server on http://localhost:3001
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
```

---

## Key files to read before making changes

| Task                   | Read first                                                 |
| ---------------------- | ---------------------------------------------------------- |
| Anything auth-related  | `auth.ts`, `middleware.ts`                                 |
| Adding/changing a page | `app/layout.tsx`, `tailwind.config.ts`                     |
| API routes             | `lib/supabase.ts`, `lib/types.ts`                          |
| Azure / login issues   | `AZURE_SETUP.md`                                           |
| Dockerising the app    | Check Open Brain MCP for NUC deployment decisions          |
| Graph view             | Check Open Brain MCP for graph view architecture decisions |
