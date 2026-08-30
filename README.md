# Our World ❤️

> *A private little universe made for two.*

---

## Status: Project Complete — Phase 5 of 5 

Our World is a privacy-first, full-stack web application for couples — a digital love journal that holds memories, diaries, realtime chat, shared events, music soundtracks, gift wishlists, playful trivia quizzes, an understanding corner for working through disagreements, and a 7-chapter cinematic birthday experience.

```
Beautiful on the outside. Extremely boring and strict on the security side. ❤️🔐
```

---

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| **Frontend** | React 19 + Vite 8 + TypeScript | ✅ Complete |
| **Styling** | Vanilla CSS + Tailwind CSS v4 | ✅ Complete |
| **Animation** | Framer Motion (springs & keyframes) | ✅ Complete |
| **Auth** | Supabase Auth (JWT) | ✅ Complete |
| **Database** | Supabase / PostgreSQL + RLS on 100% tables | ✅ Complete |
| **Realtime** | Supabase Realtime Channels | ✅ Complete |
| **Storage** | Supabase Storage (private bucket `memories-photos`) | ✅ Complete |
| **Backend** | Python 3.11 / FastAPI | ✅ Complete |
| **AI Orchestration** | LangGraph (Router & 6 Agent Nodes) | ✅ Complete |
| **AI Provider** | Groq `llama-3.3-70b-versatile` (Backend only) | ✅ Complete |
| **PWA** | Web App Manifest + Service Worker + Offline Fallback | ✅ Complete |

---

## Architecture Diagram

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
                 │   Frontend + PWA      │
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
                 ─ Birthday
                     │
                     ▼
              Draft → Human Approval UI
              (Approve / Edit / Reject)
```

---

## Complete Feature Matrix (Phases 1–5)

### Phase 1 — Foundation & Core Security
- **Landing Page & Auth**: Cinematic intro, email/password login, JWT auth session.
- **Design System**: Dark rose (`#140D11`), cream (`#FFFCF9`), burgundy (`#B83B5E`), gold (`#C9A45C`), Glassmorphism cards, Cormorant Garamond typography.
- **FastAPI Skeleton**: `/health` endpoint and `/api/v1/couples` creation API.

### Phase 2 — Onboarding, Memories, Diary & Photo Storage
- **Interactive Onboarding**: Partner pairing and couple preferences.
- **Memory Gallery (`/memories`)**: Timeline of memories, private storage photo uploads, signed URL access.
- **Notebook Diary (`/diary`)**: Private vs Shared diary entries. PostgreSQL RLS strictly isolates `PRIVATE` entries to the author.

### Phase 3 — Events, Messaging, Playlist, Gifts, Quizzes, Understanding Corner
- **Shared Calendar (`/events`)**: Anniversaries, date nights, live countdown timers, Home ticker.
- **Realtime Chat (`/messages`)**: Intimate chat via Supabase Realtime channels.
- **Music Soundtrack (`/playlist`)**: Shared music memory log with Spotify/YouTube links.
- **Gift Shop (`/gifts`)**: Wishlist grid with filter tabs (*Wishlist*, *Gifted*).
- **Playful Quizzes (`/quizzes`)**: Trivia cards, quiz builder, instant scoring.
- **Understanding Corner (`/understanding`)**: Calm, non-blame perspective cards and resolution agreements.

### Phase 4 — AI Orchestration Layer (LangGraph + Groq)
- **FastAPI AI Router (`/api/v1/ai/generate`)**: Authenticated endpoint with sliding-window rate limiter (10 req/min).
- **LangGraph Router & Agents**: Memory Agent, Love Letter Agent, Quiz Agent, Story Agent, Surprise Agent, Birthday Agent.
- **Mandatory Human Approval**: `HumanApprovalModal` allows users to Approve, Edit, or Reject any AI draft. Nothing is auto-saved.
- **Backend-only Groq Integration**: `GROQ_API_KEY` never leaks to client. Warm offline fallbacks when offline.

### Phase 5 — Birthday Experience, PWA & Production Hardening
- **Cinematic Birthday Experience (`/birthday`)**: 7-chapter interactive flow:
  1. *Intro*: Black fade-in, star particles, serif typography
  2. *Flower Bloom*: Fullscreen spring-animated rose bloom
  3. *Photo Reveals*: Slideshow of couple's memory photos
  4. *Timeline*: Vertical milestone scroll (First Hello → Today)
  5. *Birthday Speech*: AI Birthday Agent speech with rewrite trigger
  6. *Music Soundtrack*: Spinning vinyl record with memory song playback
  7. *Grand Finale*: Falling sparkles, confetti, replay & dashboard return
- **PWA Setup**: `manifest.webmanifest`, service worker (`sw.js`), `offline.html` fallback, maskable SVG icons.
- **Security Audit**: Request size limit middleware (1MB max), input length validation, RLS audit migration `004_rls_audit.sql`.
- **Deployment Prep**: `vercel.json` (SPA routing & security headers), `Procfile`, `runtime.txt`.

---

## Security Audit Checklist

| Audit Category | Rule / Test | Result |
|----------------|-------------|--------|
| **Secrets** | `GROQ_API_KEY` in frontend source or bundle | ✅ **PASS (0 occurrences)** |
| **Secrets** | `SUPABASE_SERVICE_ROLE_KEY` in frontend source | ✅ **PASS (0 occurrences)** |
| **Secrets** | `.env` files in git history | ✅ **PASS (Ignored in .gitignore)** |
| **Database** | RLS enabled on 100% of tables (14/14) | ✅ **PASS (`004_rls_audit.sql`)** |
| **Database** | Diary `PRIVATE` entries isolated by RLS | ✅ **PASS (`author_id = auth.uid()`)** |
| **Database** | Photos in private storage bucket with signed URLs | ✅ **PASS (Bucket `public = false`)** |
| **Backend** | JWT authentication required on AI endpoints | ✅ **PASS (`get_current_user_id`)** |
| **Backend** | In-memory sliding window rate limiter | ✅ **PASS (10 req/min/user)** |
| **Backend** | Request body size limit middleware | ✅ **PASS (1MB max)** |
| **Backend** | Input length & data minimization validation | ✅ **PASS (Max 500 chars/field)** |
| **AI Safety** | Mandatory Human Approval modal | ✅ **PASS (Nothing auto-saves)** |
| **PWA** | Service Worker offline fallback | ✅ **PASS (`/offline.html`)** |
| **Headers** | Security headers in `vercel.json` | ✅ **PASS (X-Frame, X-Content, CSP)** |

---

## Local Setup & Deployment

### Local Development

1. **Frontend**:
   ```bash
   cd frontend
   cp .env.example .env.local
   # Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   npm install
   npm run dev
   ```

2. **Backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, GROQ_API_KEY
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

### Production Deployment

- **Frontend (Vercel / Cloudflare Pages)**: Deploy `frontend/` directory. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_BASE_URL`.
- **Backend (Railway / Render)**: Deploy `backend/` directory using `Procfile` and `runtime.txt`. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `GROQ_API_KEY`, and `ALLOWED_ORIGINS`.
- **Database (Supabase)**: Run SQL migrations `001` through `004` in the SQL Editor.

---

*"Some stories are worth keeping."*
