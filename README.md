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
| Storage | Supabase Storage (private buckets) |
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
        anon key only     ALL secrets      Private
             │               │             Buckets
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
│   │   │   ├── Landing/    # Cinematic entry page
│   │   │   ├── Auth/       # Sign in / sign up
│   │   │   └── Home/       # Authenticated shell
│   │   ├── services/       # supabase.ts, api.ts, storage.ts
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
│   ├── migrations/         # SQL migration files
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
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
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
4. **Couple isolation** — `couple_id` verified by the database on every query
5. **AI keys on backend only** — browser never talks to Groq directly
6. **Private storage buckets** — no public photo URLs; signed access only

See [`docs/security.md`](docs/security.md) for full security model.

---

## Build Status

| Check | Status |
|-------|--------|
| Frontend TypeScript build | ✅ 0 errors |
| Secret scan in frontend/src | ✅ 0 secrets found |
| Backend FastAPI startup | ✅ clean |
| RLS on all DB tables | ✅ enforced |

---

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Foundation, auth, design system | ✅ **Complete** |
| Phase 2 | Memories, diary, photo storage | 🔜 |
| Phase 3 | Messages, events, playlist, gifts | 🔜 |
| Phase 4 | Quizzes, understanding corner, PWA | 🔜 |
| Phase 5 | AI (LangGraph + Groq), birthday experience, hardening | 🔜 |

---

## Phase 1 — Complete ✅

**Commit:** `[phase-1] foundation, auth, design system`

What was built:
- Full project skeleton (`frontend/`, `backend/`, `supabase/`, `docs/`, `tests/`)
- Vite + React + TypeScript + Tailwind v4 + Framer Motion
- Design system: color tokens (Deep Rose, Soft Rose, Cream, Wine, Gold), Cormorant Garamond + Inter typography, glass card utilities, animations
- UI primitives: `Button`, `Card`, `Input`, `Spinner`, `FlowerAccent`, `FloatingPetals`
- `Landing` page — cinematic, dark, animated entrance with floating petals
- `Auth` page — sign in / sign up with floating label inputs
- `Home` shell — authenticated dashboard with greeting, days counter, birthday countdown tile, and navigation grid
- `AppShell` with mobile bottom navigation
- Supabase schema: `profiles`, `couples`, `couple_members` + RLS on every table
- Auto-profile creation trigger on signup
- FastAPI backend: `/health` + `/api/v1/couples` (service-role key only on backend)
- JWT verification middleware
- `.env` / `.env.local` in `.gitignore` from first commit
- Zero secret keys in frontend source (verified)

---

*"Some stories are worth keeping."*
