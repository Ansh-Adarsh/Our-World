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

One record per relationship. Created by backend service role or onboarding flow.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Couple identifier (isolation key) |
| `couple_name` | TEXT | Relationship name |
| `anniversary_date` | DATE | Anniversary date for live counters |
| `partner_name` | TEXT | Partner nickname/name |
| `partner_birthday` | DATE | Partner birthday date |
| `onboarding_completed` | BOOLEAN | Whether onboarding wizard was completed |
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

**RLS**: A user can only SELECT rows where their own `user_id` appears in the same `couple_id` group.

---

## Phase 2 Tables

### `public.onboarding_answers`

Key-value answers collected during onboarding.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Primary key |
| `couple_id` | UUID FK | References `couples.id` |
| `user_id` | UUID FK | References `auth.users.id` |
| `question_key` | TEXT | Identifier for the question |
| `answer_text` | TEXT | Text answer |

**RLS**: Accessible only by members of `couple_id`.

---

### `public.memories`

Timeline memories for the couple.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Primary key |
| `couple_id` | UUID FK | References `couples.id` |
| `author_id` | UUID FK | Creator user ID |
| `title` | TEXT | Title of the memory |
| `description` | TEXT | Optional story |
| `memory_date` | DATE | Date of memory |
| `location` | TEXT | Optional location |
| `tags` | TEXT[] | Array of tags |

**RLS**: Accessible by couple members (`couple_id IN (SELECT couple_id FROM couple_members WHERE user_id = auth.uid())`).

---

### `public.memory_photos`

Photo metadata linked to memories. Photos themselves stored in private Supabase storage bucket `memories-photos`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Primary key |
| `memory_id` | UUID FK | References `memories.id` |
| `couple_id` | UUID FK | References `couples.id` |
| `storage_path` | TEXT | Storage path `{couple_id}/{memory_id}/{file}` |
| `caption` | TEXT | Optional photo caption |

---

### `public.diary_entries`

Notebook entries with strict privacy settings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Primary key |
| `couple_id` | UUID FK | References `couples.id` |
| `author_id` | UUID FK | Creator user ID |
| `title` | TEXT | Entry title |
| `content` | TEXT | Notebook entry body |
| `mood` | TEXT | Emoji mood |
| `visibility` | TEXT | `PRIVATE` or `SHARED` |
| `entry_date` | DATE | Entry date |

**RLS Security Rules**:
- `SHARED`: Readable by couple members.
- `PRIVATE`: Strictly readable ONLY by `author_id = auth.uid()`. Database layer enforced.
