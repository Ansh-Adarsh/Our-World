# Our World ❤️

> *A private little universe made for two.*

---

## Vision

Our World is a privacy-first, full-stack web application for couples — a digital love journal that holds memories, diaries, messages, events, playlists, gifts, and a cinematic birthday experience. It is beautiful on the outside and extremely strict on the security side.

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
        (Auth + DB)       Backend          Storage
        anon key only     ALL secrets      Private `memories-photos`
             │               │             Signed URLs
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
│   │   │   ├── layout/     # AppShell, PageTransition
│   │   │   └── flowers/    # FlowerAccent, FloatingPetals
│   │   ├── pages/
│   │   │   ├── Landing/    # Cinematic entrance
│   │   │   ├── Auth/       # Sign in / sign up
│   │   │   ├── Onboarding/ # Interactive question engine
│   │   │   ├── Home/       # Main dashboard with live counters
│   │   │   ├── Memories/   # Timeline gallery & photo upload
│   │   │   ├── Diary/      # Notebook UI (PRIVATE vs SHARED RLS)
│   │   │   └── Stubs/      # Messages, Events, Playlist, Gifts
│   │   ├── services/       # supabase.ts, api.ts, storage.ts, memoriesService, diaryService, onboardingService
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
│   ├── migrations/         # SQL migration files (001_initial_schema.sql, 002_phase2_schema.sql)
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
2. Go to **SQL Editor** and run:
   - `supabase/migrations/001_initial_schema.sql` (Phase 1)
   - `supabase/migrations/002_phase2_schema.sql` (Phase 2)
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
4. **Diary Privacy Guarantee** — `PRIVATE` diary entries are strictly filtered by PostgreSQL RLS (`author_id = auth.uid()`)
5. **Private storage buckets** — photos stored in private bucket `memories-photos`, accessed ONLY via temporary signed URLs
6. **Couple isolation** — `couple_id` verified by the database on every query

See [`docs/security.md`](docs/security.md) for full security model.

---

## Build Status

| Check | Status |
|-------|--------|
| Frontend TypeScript build | ✅ 0 errors |
| Secret scan in frontend/src | ✅ 0 secrets found |
| Backend FastAPI startup | ✅ clean |
| RLS on all DB tables | ✅ enforced |
| Private photo signed URLs | ✅ verified |

---

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Foundation, auth, design system | ✅ **Complete** |
| **Phase 2** | Onboarding, memories, diary, photo storage | ✅ **Phase 2 of 5 Complete** |
| Phase 3 | Messages, events, playlist, gifts | 🔜 |
| Phase 4 | Quizzes, understanding corner, PWA | 🔜 |
| Phase 5 | AI (LangGraph + Groq), birthday experience, hardening | 🔜 |

---

## Phase 2 — Complete ✅

**Commit:** `[phase-2] onboarding, memories, diary, photo storage`

What was built in Phase 2:
- **Onboarding Question Engine**: Step-by-step wizard (`/onboarding`) with progress indicator, floating petal transitions, collecting couple name, anniversary date, partner name, and birthday.
- **Home Dashboard Enhancements**: Real-time "Days Together" counter calculated from anniversary date, live partner birthday countdown card.
- **Memories Gallery & Timeline**: Grouped timeline view (by year/month), memory creation modal, photo upload backed by private Supabase storage bucket `memories-photos` with signed URLs, and cinematic detail viewer.
- **Notebook Diary with Strict RLS**: Notebook UI with `ALL`, `SHARED ❤️`, and `MY PRIVATE 🔐` views. RLS guarantees `PRIVATE` entries are strictly unreadable by anyone other than the author at the DB layer.
- **Stub Pages**: Elegant previews for Messages, Events, Playlist, and Gifts (Phase 3).
- **Database Migration (`002_phase2_schema.sql`)**: Extended `couples` table, created `onboarding_answers`, `memories`, `memory_photos`, `diary_entries`, and storage policies for `memories-photos`.

---

*"Some stories are worth keeping."*
