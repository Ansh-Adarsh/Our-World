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
| AI Orchestration | LangGraph (Phase 5) |
| AI Provider | Groq (Phase 5) |
| PWA | Vite PWA Plugin (Phase 4) |

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
                 │  ❌ NO secret keys    │
                 └───────────┬───────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
        Supabase API      FastAPI          Supabase
      (Auth + DB +      Backend          Storage
       Realtime)        ALL secrets      Private `memories-photos`
     anon key only           │             Signed URLs
             │               │
             ▼               ▼
       PostgreSQL        LangGraph (P5)
       + RLS                  │
       + Realtime             ▼
                            Groq (P5)
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
3. **RLS on every table** — default deny, explicit allow per couple membership
4. **Realtime Messaging Security** — Users can only subscribe to their own `couple_id` realtime message channel
5. **Diary Privacy Guarantee** — `PRIVATE` diary entries are strictly filtered by PostgreSQL RLS (`author_id = auth.uid()`)
6. **Private storage buckets** — photos stored in private bucket `memories-photos`, accessed ONLY via temporary signed URLs
7. **Couple isolation** — `couple_id` verified by the database on every query

See [`docs/security.md`](docs/security.md) for full security model.

---

## Build Status

| Check | Status |
|-------|--------|
| Frontend TypeScript build | ✅ 0 errors |
| Secret scan in frontend/src | ✅ 0 secrets found |
| Backend FastAPI startup | ✅ clean |
| RLS on all DB tables | ✅ enforced |
| Supabase Realtime Channels | ✅ configured |

---

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Foundation, auth, design system | ✅ **Complete** |
| **Phase 2** | Onboarding, memories, diary, photo storage | ✅ **Complete** |
| **Phase 3** | Events, messaging, playlist, gifts, quizzes, understanding corner | ✅ **Phase 3 of 5 Complete** |
| Phase 4 | Quizzes enhancement, understanding corner AI prep, PWA | 🔜 |
| Phase 5 | AI (LangGraph + Groq), birthday experience, hardening | 🔜 |

---

## Phase 3 — Complete ✅

**Commit:** `[phase-3] events, messaging, playlist, gifts, quizzes, understanding corner`

What was built in Phase 3:
- **Layout & Full-Width Fix**: Updated `PageTransition.tsx` (`w-full`) so all subpages expand 100% width across the screen.
- **Events & Countdown Engine (`/events`)**: Shared events calendar, category tags (*anniversary*, *date_night*, *trip*, *milestone*), live countdown timers, and Home dashboard Next Event Ticker card integration.
- **Realtime Chat (`/messages`)**: Intimate couple chat with Supabase Realtime channel subscriptions, message history, timestamp formatting, and quick heart action.
- **Playlist Soundtrack (`/playlist`)**: Shared music soundtrack storing title, artist, link (Spotify/YouTube/Apple Music), and personal memory notes.
- **Gift Shop & Wishlist (`/gifts`)**: Gift wishlist grid with filter tabs (*All*, *Wishlist*, *Gifted 🎁*) and mark-as-given status toggles.
- **Playful Quizzes (`/quizzes`)**: Interactive "How Well Do You Know Us?" trivia cards, quiz taker with instant score reveal (*e.g. 4/5 Correct! 🎉*), and quiz builder modal.
- **Understanding Corner (`/understanding`)**: Calm, non-blame structured entry space for working through disagreements with perspective cards, resolution agreements, and status tags.
- **More Experiences Hub (`/more`) & Mobile Navigation Dock**: Updated bottom dock mapping Home / Memories / Add (+) / Chat / More hub.
- **Database Migration (`003_phase3_schema.sql`)**: Full RLS policies for `events`, `messages`, `playlist_songs`, `gifts`, `quizzes`, `quiz_questions`, `quiz_answers`, `understanding_entries`, and Realtime publication setup.

---

*"Some stories are worth keeping."*
