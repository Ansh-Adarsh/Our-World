# Our World ❤️

> *A private little universe made for two.*

---

## Vision

Our World is a privacy-first, full-stack web application for couples — a digital love journal that holds memories, diaries, messages, events, playlists, gifts, quizzes, an understanding corner, and a cinematic birthday experience. It is beautiful on the outside and extremely strict on the security side.

```
Beautiful on the outside. Extremely boring and strict on the security side. ❤️🔐
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Auth | Supabase Auth (JWT) |
| Database | Supabase / PostgreSQL + RLS |
| Realtime | Supabase Realtime Channels |
| Storage | Supabase Storage (private bucket `memories-photos`) |
| Backend | Python / FastAPI |
| AI Orchestration | LangGraph (Phase 4 — active) |
| AI Provider | Groq `llama-3.3-70b-versatile` (Phase 4 — active) |
| PWA | Vite PWA Plugin (Phase 5) |

---

## Architecture

```
                           INTERNET
                              │
                              ▼
                    ┌──────────────────┐
                    │   Cloudflare /   │
                    │      Vercel      │
                    └────────┬─────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │     React + Vite      │
                 │       Frontend        │
                 │                       │
                 │  ✅ anon key only     │
                 │  ❌ NO Groq key       │
                 │  ❌ NO service key    │
                 └───────────┬───────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
        Supabase API      FastAPI          Supabase
      (Auth + DB +      Backend          Storage
       Realtime)        ALL secrets      Private `memories-photos`
     anon key only      GROQ_API_KEY     Signed URLs
             │          Rate Limiter
             ▼               │
       PostgreSQL       LangGraph Router
       + RLS                 │
       + Realtime    ┌───────┴──────────┐
                     │                  │
                 Agent Nodes       Groq LLM
                 ─ Memory          (backend only)
                 ─ LoveLetter
                 ─ Quiz
                 ─ Story
                 ─ Surprise
                 ─ Birthday (stub)
                     │
                     ▼
              Draft → Human Approval UI
              (Approve / Edit / Reject)
```

---

## Folder Structure

```
our-world/
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # Button, Card, Input, Spinner
│   │   │   ├── layout/     # AppShell, PageTransition (full-width)
│   │   │   └── flowers/    # FlowerAccent, FloatingPetals
│   │   ├── pages/
│   │   │   ├── Landing/    # Cinematic entrance
│   │   │   ├── Auth/       # Sign in / sign up
│   │   │   ├── Onboarding/ # Interactive question engine
│   │   │   ├── Home/       # Dashboard with live counters & event ticker
│   │   │   ├── Memories/   # Timeline gallery & photo upload
│   │   │   ├── Diary/      # Notebook UI (PRIVATE vs SHARED RLS)
│   │   │   ├── Events/     # Shared calendar & countdown timers
│   │   │   ├── Messages/   # Realtime intimate chat
│   │   │   ├── Playlist/   # Music soundtrack
│   │   │   ├── Gifts/      # Wishlist & surprise gifts
│   │   │   ├── Quizzes/    # Playful "How well do you know us?" trivia
│   │   │   ├── Understanding/# Calm resolution space for disagreements
│   │   │   └── More/       # Experiences hub drawer
│   │   ├── services/       # Supabase, events, messages, playlist, gifts, quizzes, understanding
│   │   ├── stores/         # authStore (Zustand)
│   │   └── types/          # TypeScript interfaces
│   ├── .env.example        # ← Template (commit this)
│   └── .env.local          # ← Your values (NEVER commit)
│
├── backend/                # Python / FastAPI
│   ├── app/
│   │   ├── main.py         # App factory + routes
│   │   └── core/           # config, security, logging
│   ├── .env.example        # ← Template (commit this)
│   └── .env                # ← Your values (NEVER commit)
│
├── supabase/
│   ├── migrations/         # SQL migration files (001_initial_schema.sql, 002_phase2_schema.sql, 003_phase3_schema.sql)
│   └── seed.sql
│
├── docs/                   # Architecture, security, database docs
└── tests/                  # Frontend + backend test directories
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Supabase project (free tier)

---

### 1. Clone & environment files

```bash
git clone <your-repo-url>
cd our-world

# Frontend env
cp frontend/.env.example frontend/.env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Backend env
cp backend/.env.example backend/.env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
# Fill in GROQ_API_KEY (Phase 4 AI features — get from https://console.groq.com)
```

---

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run in order:
   - `supabase/migrations/001_initial_schema.sql` (Phase 1)
   - `supabase/migrations/002_phase2_schema.sql` (Phase 2)
   - `supabase/migrations/003_phase3_schema.sql` (Phase 3)
3. Copy your **Project URL** and **anon key** into `frontend/.env.local`
4. Copy your **Project URL**, **service role key**, and **JWT secret** into `backend/.env`

---

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

### 4. Run the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
# → Health check: http://localhost:8000/health
```

---

## Security Rules

1. **Frontend is public** — treat it as if anyone can read your JavaScript bundle
2. **Service-role key** never appears in frontend code or git history — ever
3. **Groq API key** lives exclusively in `backend/.env` — the browser never contacts Groq directly
4. **RLS on every table** — default deny, explicit allow per couple membership
5. **Realtime Messaging Security** — Users can only subscribe to their own `couple_id` realtime message channel
6. **Diary Privacy Guarantee** — `PRIVATE` diary entries are strictly filtered by PostgreSQL RLS (`author_id = auth.uid()`)
7. **Private storage buckets** — photos stored in private bucket `memories-photos`, accessed ONLY via temporary signed URLs
8. **Couple isolation** — `couple_id` verified by the database on every query
9. **AI rate limiting** — AI endpoints enforce max 10 requests per user per 60 seconds
10. **AI data minimization** — prompts send only specific context fields (title/location/topic), never full message history or diary dumps
11. **Mandatory human approval** — AI-generated content requires Approve/Edit/Reject before any content is saved or sent

See [`docs/security.md`](docs/security.md) for full security model.

---

## Build Status

| Check | Status |
|-------|--------|
| Frontend TypeScript build | ✅ 0 errors |
| Secret scan in frontend/src | ✅ 0 secrets found |
| Groq key in frontend/src | ✅ 0 occurrences |
| Backend FastAPI startup | ✅ clean |
| RLS on all DB tables | ✅ enforced |
| Supabase Realtime Channels | ✅ configured |
| AI rate limiting | ✅ 10 req/min/user |
| Human approval flow | ✅ all AI drafts gated |

---

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Foundation, auth, design system | ✅ **Complete** |
| **Phase 2** | Onboarding, memories, diary, photo storage | ✅ **Complete** |
| **Phase 3** | Events, messaging, playlist, gifts, quizzes, understanding corner | ✅ **Complete** |
| **Phase 4** | FastAPI backend, LangGraph agents, Groq AI, human approval flow | ✅ **Phase 4 of 5 Complete** |
| Phase 5 | Birthday cinematic experience, PWA, AI hardening | 🔜 |

---

## Phase 3 — Complete ✅

**Commit:** `[phase-3] events, messaging, playlist, gifts, quizzes, understanding corner`

What was built in Phase 3:
- **Layout & Full-Width Fix**: Updated `PageTransition.tsx` (`w-full`) so all subpages expand 100% width across the screen.
- **Events & Countdown Engine (`/events`)**: Shared events calendar, category tags, live countdown timers, and Home dashboard Next Event Ticker.
- **Realtime Chat (`/messages`)**: Intimate couple chat with Supabase Realtime channel subscriptions, message history, and quick heart action.
- **Playlist Soundtrack (`/playlist`)**: Shared music soundtrack storing title, artist, link, and personal memory notes.
- **Gift Shop & Wishlist (`/gifts`)**: Gift wishlist grid with filter tabs and mark-as-given status toggles.
- **Playful Quizzes (`/quizzes`)**: Interactive trivia cards, quiz taker with instant scoring, and quiz builder modal.
- **Understanding Corner (`/understanding`)**: Calm, non-blame structured entry space with perspective cards, resolution agreements, and status tags.
- **More Hub (`/more`) & Navigation Dock**: Home / Memories / Add (+) / Chat / More.
- **Database Migration (`003_phase3_schema.sql`)**: Full RLS policies for all Phase 3 tables and Realtime publication setup.

---

## Phase 4 — Complete ✅

**Commit:** `[phase-4] FastAPI backend, LangGraph agents, Groq integration, human approval flow`

### AI Architecture

```
[React Frontend] ─── POST /api/v1/ai/generate ──► [FastAPI Backend]
     (no Groq key)     (JWT Bearer Token)           (holds GROQ_API_KEY)
                                                             │
                                                    Rate Limiter (10/min)
                                                             │
                                                    LangGraph Router Node
                                                             │
                    ┌────────────────────────────────────────┤
                    │                                        │
             Agent Nodes                              Groq LLM API
             ─ MemoryAgent (captions)                 (backend only)
             ─ LoveLetterAgent (letters)
             ─ QuizAgent (trivia questions)
             ─ StoryAgent (narratives)
             ─ SurpriseAgent (date ideas)
             ─ BirthdayAgentStub (Phase 5)
                    │
                    ▼
         Draft Candidate Returned
                    │
                    ▼
    ┌─── Human Approval Modal (Frontend) ───┐
    │  Approve ✨  │  Edit ✏️  │  Reject ❌  │
    └─────────────────────────────────────--┘
             Nothing auto-saves.
```

### What was built in Phase 4:
- **FastAPI AI Router (`/api/v1/ai/generate`)**: Authenticated, rate-limited endpoint (10 req/min/user).
- **LangGraph Orchestration (`app/agents/graph.py`)**: Router node dispatching to specialized agents.
- **Groq LLM Integration (`app/ai/groq_client.py`)**: Backend-only Groq API caller with graceful fallback if unconfigured.
- **Rate Limiter (`app/core/rate_limiter.py`)**: In-memory sliding-window rate limiter per user.
- **AI Schemas (`app/schemas/ai.py`)**: Typed Pydantic request/response models.
- **Human Approval Modal (`HumanApprovalModal.tsx`)**: Reusable component presenting AI drafts with Approve / Edit / Reject actions. Nothing publishes automatically.
- **AI Caption Assistant** integrated into Memories memory creation form.
- **AI Love Letter Draft** integrated into Messages chat header.
- **AI Quiz Suggestion** integrated into Quizzes builder modal.
- **AI Surprise Date Idea** integrated into Home dashboard.
- **Data minimization**: Prompts send only specific fields (title, location, topic, partner_name) — never full diary/message history.
- **Offline fallback**: All AI calls gracefully degrade to warm structured mock content when GROQ_API_KEY is unset.

---

*"Some stories are worth keeping."*
