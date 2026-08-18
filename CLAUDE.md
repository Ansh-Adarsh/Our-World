# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Our World" — a private two-person couples app (memories, diary, chat, events, playlist, gifts, quizzes, understanding corner, cinematic birthday experience). Three deployable pieces in one repo: `frontend/` (React 19 + Vite + TS), `backend/` (FastAPI), `supabase/` (SQL migrations).

The project's stated design principle, repeated across `docs/security.md` and the source comments: *"Beautiful on the outside. Extremely boring and strict on the security side."*

## Commands

```bash
# Frontend (from frontend/)
npm install
npm run dev        # Vite dev server on :5173
npm run build      # tsc -b && vite build
npm run lint       # oxlint (NOT eslint — config is .oxlintrc.json)
npm run preview

# Backend (from backend/)
python -m venv .venv
.venv\Scripts\activate          # Windows; source .venv/bin/activate on POSIX
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# /docs and /redoc are only mounted when DEBUG=true
```

There is **no test suite** — no pytest files, no frontend test runner, no CI config. Verify changes by running the dev server (`/run` skill) and by `npm run build` for type errors. Do not claim tests pass.

Database migrations are **not** applied by a CLI in this workflow — `supabase/migrations/001`–`004` are run by hand in the Supabase SQL Editor, in order.

### Environment

- `frontend/.env.local` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`. Anon key here is intentional and safe (RLS is the real boundary).
- `backend/.env` — `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (Supabase project's JWT secret), `GROQ_API_KEY`, `ALLOWED_ORIGINS`, `DEBUG`.

## Trust boundary (the core architectural rule)

Two separate paths reach data, and which one you use is a security decision, not a convenience one:

1. **Frontend → Supabase directly** (anon key + user JWT) for all ordinary CRUD. Authorization is enforced entirely by PostgreSQL RLS, never by client-side checks.
2. **Frontend → FastAPI** only for operations that need a secret: couple creation (`POST /api/v1/couples`, uses the service-role key to bypass RLS) and all AI generation (`POST /api/v1/ai/generate`, holds `GROQ_API_KEY`).

The React bundle must contain **zero** secrets. Never import the service-role key or a Groq key into `frontend/`, and never call an LLM provider from the browser. If a new feature needs privileged access, it belongs behind a FastAPI endpoint guarded by `get_current_user_id`.

## Data layer conventions

- `couple_id` is the isolation boundary. Every feature table carries it, and every RLS policy uses the same shape:
  ```sql
  couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid())
  ```
  `diary_entries` layers author privacy on top: `PRIVATE` rows are visible only where `author_id = auth.uid()`. `004_rls_audit.sql` re-asserts `ENABLE ROW LEVEL SECURITY` on all 14 tables and keeps the `memories-photos` bucket at `public = false`.
- Migrations are append-only. Add `005_*.sql` rather than editing an earlier file — earlier ones are already applied to live projects.
- Photos live in the private `memories-photos` bucket at `{couple_id}/{memory_id}/{uuid}.{ext}` and are read only through `createSignedUrl` (`services/storage.ts`). Never make the bucket public or build a public URL.
- Realtime uses per-couple channels: `couple-messages-${coupleId}` with a `postgres_changes` INSERT filter (`services/messagesService.ts`).

## The fallback pattern (important and easy to trip over)

Every layer degrades instead of failing, so the app renders with placeholder credentials and no backend:

- Each `frontend/src/services/*Service.ts` wraps its Supabase call in try/catch and returns `getDemoX(coupleId)` on error. **It also returns demo data when the query succeeds but is empty** (`data.length > 0 ? data : getDemo…()`), so a genuinely empty table looks populated. Keep this in mind when debugging "why is this row here" — check for `demo-` prefixed IDs.
- Writes that fail return a locally-constructed object with `crypto.randomUUID()` so the UI stays responsive; nothing was actually persisted.
- Pages resolve their couple as `couple?.id || 'demo-couple'`.
- AI has three fallback layers: `aiService.ts` catches network failure → `getOfflineFallback()`; `groq_client.py` returns `generate_mock_fallback()` when `GROQ_API_KEY` is unset or the call throws; `graph.py` has `default_agent_node`. A plausible-looking AI response therefore does **not** prove Groq was reached — check backend logs.
- `main.py`'s `create_couple` returns a mock UUID when Supabase credentials are absent.

When adding a service, follow this pattern; when debugging, remember that silence here means fallback, not success.

## AI pipeline

`services/aiService.ts` → `POST /api/v1/ai/generate` → `check_rate_limit` → `app/agents/graph.py::route_and_execute_agent` → `app/ai/groq_client.py::call_groq_llm` → response with `requires_approval: true` → rendered in `components/ui/HumanApprovalModal.tsx`.

- **Nothing AI-generated is ever auto-saved.** The draft must pass through `HumanApprovalModal` (Approve / Edit / Reject) before it is written or sent. Four integration points do this today: `Home`, `Memories`, `Messages`, `Quizzes`; `Birthday/scenes/SceneLetter.tsx` triggers the birthday agent.
- Despite the name, `graph.py` is **not** a compiled LangGraph `StateGraph` — it's an `if/elif` dispatcher over async node functions sharing an `AgentState` TypedDict. `langgraph` is in `requirements.txt` but unused. Don't assume graph APIs exist.
- Data minimization is enforced in `schemas/ai.py`: max 10 context keys, string values truncated at 500 chars. Pass narrow fields (title, location, partner_name), never rows or dumps.
- `core/rate_limiter.py` is an in-process dict (10 req/min/user). It resets on restart and does not coordinate across workers — treat it as a cost guard, not a security control.

**Adding an AI intent touches four places**: the `intent` union in `aiService.ts`, a new `*_agent_node` in `graph.py`, its branch in `route_and_execute_agent`, and the `friendlyIntent` label map in `HumanApprovalModal.tsx`.

## Frontend structure

- Routes are declared in `src/App.tsx`. Protected pages nest under `<AppShell />`, and **the auth guard lives in `AppShell`, not in the routes** — it redirects to `/auth` once `isLoading` is false. New protected pages just need to be children of that route element.
- `AppShell` renders the fixed bottom glass dock and hides it for `/birthday` via `isFullscreen`. A new secondary feature is reached from `pages/More/MoreMenu.tsx` (its `route:` list), not from the dock.
- `@/` resolves to `frontend/src` (`vite.config.ts` alias + tsconfig paths).
- Auth/couple state is a single Zustand store, `stores/authStore.ts`, synced via `supabase.auth.onAuthStateChange`. Everything else is local component state.
- Shared row/entity types live in `src/types/index.ts` and mirror the SQL column names (snake_case) — services return those shapes directly.

### Styling

Tailwind v4 through `@tailwindcss/vite` — tokens are declared in an `@theme` block in `src/index.css`, and **there is no `tailwind.config.js`**. Add new colors/fonts/radii there. Palette: dark `#241B20`, rose deep `#B83B5E`, rose soft `#E98DA3`, gold `#C9A45C`, warm white `#FFFCF9`; Cormorant Garamond for headings, Inter for body. `index.css` also defines the reusable `.glass-card`, `.bg-our-world`, `.heading-display`, `.body-elegant`, `.caption-gold` classes. Existing components freely mix these tokens with inline hex literals and Framer Motion springs — match the surrounding file rather than normalizing it.

## PWA / deployment

- Service worker is registered by an inline script in `frontend/index.html` (not from `main.tsx`). `public/sw.js` caches a static shell and **deliberately bypasses API and Supabase requests** so no private data is cached; offline navigations fall back to `public/offline.html`. Bump `CACHE_NAME` when the shell changes.
- Frontend deploys from `frontend/` with `vercel.json` (SPA rewrite + `X-Frame-Options: DENY`, nosniff, referrer and permissions policies). Backend deploys from `backend/` via `Procfile` + `runtime.txt` (Python 3.11.9); set `ALLOWED_ORIGINS` to the real frontend origin.

## Reference docs

`docs/architecture.md`, `docs/database.md`, `docs/security.md`, and the root `README.md` describe the intended design and the phase history. They lag the code in places (e.g. architecture.md still labels AI as "Phase 5" future work, and describes JWTs as not stored in localStorage while `supabase.ts` sets `persistSession: true`) — trust the source when they disagree. `frontend/README.md` is unmodified Vite template boilerplate.
