# Security Model — Our World

## Guiding Principle

> **Beautiful on the outside. Extremely boring and strict on the security side.**

## Secret Separation

| Secret | Location | Never in |
|--------|----------|----------|
| Supabase service-role key | `backend/.env` | Frontend, git |
| Groq API key | `backend/.env` | Frontend, git |
| JWT secret | `backend/.env` | Frontend, git |
| PostgreSQL password | Supabase managed | Anywhere client-side |
| Supabase anon key | `frontend/.env.local` | Git (as actual value) |

The anon key is intentionally public — it is constrained by RLS policies.

## Row Level Security

Every table has RLS enabled with default DENY. Access is granted only by explicit policies.

### Current Policies (Phase 1)

| Table | Policy | Condition |
|-------|--------|-----------|
| `profiles` | SELECT | `auth.uid() = id` |
| `profiles` | UPDATE | `auth.uid() = id` |
| `couples` | SELECT | User is in `couple_members` for that couple |
| `couples` | UPDATE | User is in `couple_members` for that couple |
| `couple_members` | SELECT | User's own couple_id matches |

Couple creation uses the **service-role key on the backend** — the client cannot create couples directly.

## Couple Isolation

`couple_id` is the central isolation boundary. Every data table in future phases will include a `couple_id` foreign key. RLS policies will always verify:

```sql
couple_id IN (
  SELECT couple_id FROM couple_members WHERE user_id = auth.uid()
)
```

This means even if a client manipulates a request to use another couple's ID, the database will reject it.

## Frontend as Public Surface

The React bundle should be treated as if it were publicly available source code. At any point in time, it must contain **zero** secrets. DevTools inspection should reveal nothing exploitable.

## AI Security (Phase 5)

The browser never communicates with Groq directly. All AI calls pass through FastAPI, where:
1. The user's JWT is verified
2. Only minimum necessary data is forwarded to the AI
3. The Groq key never leaves the backend

## Security Checklist (Phase 1 Complete)

- [x] `.env` and `.env.local` in `.gitignore` from first commit
- [x] No service-role key in frontend source
- [x] No Groq key in frontend source
- [x] RLS enabled on all Phase 1 tables
- [x] Couple membership enforced at DB level
- [x] Backend verifies JWT before privileged operations
- [x] CORS restricted to known origins
- [x] API docs disabled in production mode
- [x] Logs never contain private content
