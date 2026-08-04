# Architecture — Our World

## System Overview

```
                           INTERNET
                              │
                              ▼
                    ┌──────────────────┐
                    │   Cloudflare /   │
                    │      Vercel      │
                    │  (Static Host)   │
                    └────────┬─────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │     React + Vite      │
                 │       Frontend        │
                 │                       │
                 │  ✅ Supabase anon key │
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
       PostgreSQL        LangGraph
       + RLS              (Phase 5)
       + Realtime              │
                               ▼
                             Groq
                          (Phase 5)
```

## Request Flow

### Authentication
```
User → React → Supabase Auth → JWT issued
JWT stored in memory/session (not localStorage)
JWT sent as Bearer token to FastAPI for privileged ops
FastAPI verifies JWT using JWT_SECRET (backend only)
```

### Data Access
```
User → React → Supabase (anon key + JWT)
→ PostgreSQL (RLS enforced)
→ Only rows where user is a couple member returned
```

### AI Flow (Phase 5)
```
User → React → FastAPI (verified JWT)
→ LangGraph orchestration
→ Groq (API key on backend only)
→ Result returned to React
```

## Component Map

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite + TypeScript | UI, routing, state |
| Styling | Tailwind CSS | Design tokens, layout |
| Animation | Framer Motion | Transitions, floating elements |
| Auth | Supabase Auth | JWT-based user auth |
| Database | Supabase / PostgreSQL | Relational data + RLS |
| Storage | Supabase Storage | Private photo/media buckets |
| Backend | FastAPI + Python | Privileged ops, AI proxy |
| AI Orchestration | LangGraph | Multi-agent workflows (Phase 5) |
| AI Provider | Groq | LLM inference (Phase 5) |
| PWA | Vite PWA Plugin | Offline, installable (Phase 4) |
