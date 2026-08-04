# Database Schema — Our World

## Phase 1 Tables

### `public.profiles`

Auto-created on user signup via trigger. One-to-one with `auth.users`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | References `auth.users.id` |
| `display_name` | TEXT | User's display name |
| `avatar_url` | TEXT | Optional profile photo URL |
| `created_at` | TIMESTAMPTZ | Account creation time |
| `updated_at` | TIMESTAMPTZ | Auto-updated on change |

**RLS**: User can only SELECT/UPDATE their own row.

---

### `public.couples`

One record per relationship. Created by backend service role only.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Couple identifier (isolation key) |
| `couple_name` | TEXT | Optional name for the relationship |
| `anniversary_date` | DATE | Optional anniversary |
| `partner_1_id` | UUID FK | First partner (auth.users) |
| `partner_2_id` | UUID FK | Second partner — set on invite acceptance |
| `created_at` | TIMESTAMPTZ | — |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

**RLS**: Only members in `couple_members` for this `couple_id` can SELECT/UPDATE.

---

### `public.couple_members`

Join table. The source of truth for couple membership. Used in every RLS policy.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | — |
| `couple_id` | UUID FK | References `couples.id` |
| `user_id` | UUID FK | References `auth.users.id` |
| `role` | TEXT | `member` or `admin` |
| `joined_at` | TIMESTAMPTZ | — |

**UNIQUE**: `(couple_id, user_id)` — a user can only be in a couple once.

**RLS**: A user can only SELECT rows where their own `user_id` appears in the same `couple_id` group. INSERT/DELETE is backend-only.

---

## RLS Pattern (used in all future tables)

```sql
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<table>_couple_member"
  ON public.<table> FOR SELECT
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid()
    )
  );
```

This pattern is used identically for memories, diary, messages, events, playlist, gifts, quizzes in future phases.

## Future Tables (Phase 2+)

All will include `couple_id UUID NOT NULL REFERENCES couples(id)` and follow the RLS pattern above.

| Table | Phase |
|-------|-------|
| `memories` | 2 |
| `memory_photos` | 2 |
| `diary_entries` | 2 |
| `messages` | 3 |
| `events` | 3 |
| `playlist_songs` | 3 |
| `gifts` | 3 |
| `quizzes` | 4 |
| `quiz_answers` | 4 |
| `ai_suggestions` | 5 |
