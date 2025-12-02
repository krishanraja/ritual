# Database Documentation

## Schema Overview

The database uses PostgreSQL (Supabase) with Row Level Security (RLS) enabled on all tables.

### Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    ├──→ profiles (public.profiles)
    │      │
    │      └──→ couples (partner_one, partner_two FK)
    │             │
    │             ├──→ weekly_cycles (couple_id FK)
    │             │     │
    │             │     ├──→ completions (weekly_cycle_id FK)
    │             │     ├──→ ritual_feedback (weekly_cycle_id FK)
    │             │     └──→ ritual_preferences (weekly_cycle_id FK)
    │             │
    │             ├──→ ritual_memories (couple_id FK)
    │             ├──→ ritual_streaks (couple_id FK, 1:1)
    │             └──→ ritual_suggestions (couple_id FK)
    │
    └──→ ritual_library (global, no FK)
```

---

## Table Schemas

### profiles

Stores additional user information beyond Supabase auth.users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | - | PK, matches auth.users.id |
| name | text | No | - | User's display name |
| email | text | Yes | - | User's email (from auth) |
| preferred_city | text | Yes | 'New York' | City for ritual customization |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY (id)

**RLS Policies:**
- Users can view their own profile
- Users can view their partner's profile (if in active couple)
- Users can update their own profile

**Trigger:** Created automatically by `handle_new_user()` function on auth.users INSERT.

---

### couples

Represents a couple's ritual space.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| partner_one | uuid | No | - | FK to profiles.id (creator) |
| partner_two | uuid | Yes | - | FK to profiles.id (joiner) |
| couple_code | text | No | - | 6-digit join code (UNIQUE) |
| code_expires_at | timestamptz | Yes | now() + 24 hours | Code expiration |
| is_active | boolean | Yes | true | Soft delete flag |
| preferred_city | text | Yes | 'New York' | Default city for rituals |
| current_cycle_week_start | date | Yes | - | Cached week start (denormalized) |
| synthesis_ready | boolean | Yes | false | Legacy flag (TODO: remove) |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (couple_code)

**RLS Policies:**
- Authenticated users can create couples (as partner_one)
- Anyone can view joinable couples (partner_two IS NULL)
- Anyone can join open couples (update partner_two)
- Users can view their own couple
- Partner one can update couple
- Partner one can delete couple
- Partner two can leave couple (set partner_two = NULL)

**Constraints:**
- CHECK (partner_one != partner_two)

---

### weekly_cycles

Represents one week's ritual cycle for a couple.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| couple_id | uuid | No | - | FK to couples.id |
| week_start_date | date | No | - | Monday of the week (YYYY-MM-DD) |
| partner_one_input | jsonb | Yes | - | P1's input data |
| partner_one_submitted_at | timestamptz | Yes | - | P1 submission timestamp |
| partner_two_input | jsonb | Yes | - | P2's input data |
| partner_two_submitted_at | timestamptz | Yes | - | P2 submission timestamp |
| synthesized_output | jsonb | Yes | - | AI-generated rituals array |
| generated_at | timestamptz | Yes | - | Synthesis timestamp |
| agreement_reached | boolean | Yes | false | True when couple agrees on ritual |
| agreed_ritual | jsonb | Yes | - | The chosen ritual object |
| agreed_date | date | Yes | - | Scheduled date |
| agreed_time | time | Yes | - | Scheduled time |
| nudged_at | timestamptz | Yes | - | Last nudge timestamp |
| canvas_state_one | jsonb | Yes | - | P1's MagneticCanvas state (legacy) |
| canvas_state_two | jsonb | Yes | - | P2's MagneticCanvas state (legacy) |
| sync_completed_at | timestamptz | Yes | - | Legacy field |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (couple_id)
- INDEX (week_start_date)
- **TODO:** UNIQUE (couple_id, week_start_date)

**RLS Policies:**
- Users can view their cycles
- Users can insert their cycles
- Users can update their cycles

**JSONB Schemas:**

**partner_one_input / partner_two_input:**
```json
{
  "energy": "high" | "medium" | "low" | "variable",
  "availability": "30min" | "1-2hrs" | "3+hrs" | "flexible",
  "budget": "$" | "$$" | "$$$" | "free",
  "craving": "intimacy" | "adventure" | "relaxation" | "creativity" | "spontaneity",
  "desire": "string" // Optional free text
}
```

**synthesized_output:**
```json
[
  {
    "title": "string",
    "description": "string",
    "time_estimate": "string",
    "budget_band": "string",
    "category": "string",
    "why": "string"
  }
]
```

**agreed_ritual:**
```json
{
  "title": "string",
  "description": "string",
  "time_estimate": "string",
  "budget_band": "string",
  "category": "string",
  "why": "string" // optional
}
```

---

### ritual_preferences

Stores each partner's ranked ritual choices during voting.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| weekly_cycle_id | uuid | No | - | FK to weekly_cycles.id |
| user_id | uuid | No | - | Which partner voted |
| ritual_title | text | No | - | Title of chosen ritual |
| rank | integer | No | - | 1, 2, or 3 |
| ritual_data | jsonb | No | - | Full ritual object |
| proposed_date | date | Yes | - | Suggested date |
| proposed_time | time | Yes | - | Suggested time |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (weekly_cycle_id)
- INDEX (user_id)

**RLS Policies:**
- Users can view their couple's preferences
- Users can insert their preferences
- Users can update their preferences
- Users can delete their preferences

---

### completions

Tracks when a ritual is marked as completed.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| weekly_cycle_id | uuid | No | - | FK to weekly_cycles.id |
| ritual_title | text | No | - | Completed ritual title |
| completed_at | timestamptz | No | now() | Completion timestamp |
| created_at | timestamptz | No | now() | Record creation |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (weekly_cycle_id)

**RLS Policies:**
- Users can view their completions
- Users can insert their completions

---

### ritual_feedback

Stores post-ritual check-in feedback.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| couple_id | uuid | No | - | FK to couples.id |
| weekly_cycle_id | uuid | No | - | FK to weekly_cycles.id |
| did_complete | boolean | Yes | - | True if completed |
| connection_rating | integer | Yes | - | 1-5 stars |
| would_repeat | text | Yes | - | "yes" | "no" | "maybe" |
| notes | text | Yes | - | Free-form reflection |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (couple_id)
- INDEX (weekly_cycle_id)
- UNIQUE (weekly_cycle_id) // One feedback per cycle

**RLS Policies:**
- Users can view their couple's feedback
- Users can insert their couple's feedback
- Users can update their couple's feedback

**Trigger:** `update_updated_at_column()` on UPDATE

---

### ritual_memories

Long-term storage of completed rituals with photos and notes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| couple_id | uuid | No | - | FK to couples.id |
| ritual_title | text | No | - | Ritual title |
| ritual_description | text | Yes | - | Description |
| completion_date | date | No | - | When completed |
| rating | integer | Yes | - | 1-5 stars |
| notes | text | Yes | - | Reflection |
| photo_url | text | Yes | - | Storage URL (future) |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (couple_id)
- INDEX (completion_date)
- INDEX (rating) WHERE rating >= 4 // For high-rated queries

**RLS Policies:**
- Users can view their couple's memories
- Users can create their couple's memories
- Users can update their couple's memories
- Users can delete their couple's memories

**Trigger:** `update_updated_at_column()` on UPDATE

---

### ritual_streaks

Tracks couples' completion streaks.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| couple_id | uuid | No | - | FK to couples.id (UNIQUE) |
| current_streak | integer | No | 0 | Current consecutive weeks |
| longest_streak | integer | No | 0 | All-time longest streak |
| last_completion_date | date | Yes | - | Date of last completion |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (couple_id)

**RLS Policies:**
- Users can view their couple's streak
- Users can insert their couple's streak
- Users can update their couple's streak

**Trigger:** `update_updated_at_column()` on UPDATE

**Business Logic:**
- Increment `current_streak` when ritual completed within 7 days of `last_completion_date`
- Reset `current_streak` to 1 if gap > 7 days
- Update `longest_streak` if `current_streak` exceeds it

---

### ritual_suggestions

AI-generated proactive ritual suggestions (future feature).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| couple_id | uuid | No | - | FK to couples.id |
| suggested_ritual | jsonb | No | - | Ritual object |
| reason | text | No | - | Why suggested |
| based_on_history | jsonb | Yes | - | Context data |
| shown_at | timestamptz | No | now() | When shown |
| accepted | boolean | Yes | - | Did they use it? |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (couple_id)
- INDEX (shown_at)

**RLS Policies:**
- System can create suggestions (INSERT policy: true)
- Users can view their couple's suggestions
- Users can update their couple's suggestions (mark accepted)

---

### ritual_library

Global library of ritual templates (currently unused).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | PK |
| title | text | No | - | Ritual title |
| description | text | No | - | Description |
| category | text | No | - | Category tag |
| time_estimate | text | No | - | e.g. "1-2 hours" |
| budget_band | text | No | - | "$", "$$", etc. |
| constraints | jsonb | Yes | '{}' | Additional metadata |
| created_at | timestamptz | No | now() | Creation timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (category)

**RLS Policies:**
- Anyone can view ritual library (SELECT: true)

**Note:** Currently not used. Rituals generated fresh by AI each time.

---

## Database Functions

### handle_new_user()

**Purpose:** Automatically create profile when user signs up.

**Trigger:** AFTER INSERT ON auth.users

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

### update_updated_at_column()

**Purpose:** Auto-update `updated_at` timestamp on row update.

**Used By:** ritual_feedback, ritual_memories, ritual_streaks

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

---

## Indexes

### Current Indexes
- All PRIMARY KEY columns
- All FOREIGN KEY columns
- `couples.couple_code` (UNIQUE)
- `weekly_cycles.week_start_date`
- `ritual_memories.completion_date`
- `ritual_memories.rating WHERE rating >= 4`
- `ritual_library.category`

### TODO: Add Indexes
- `weekly_cycles (couple_id, week_start_date)` - UNIQUE constraint
- `completions.completed_at` - For historical queries
- `ritual_suggestions.shown_at` - For recent suggestions

---

## Data Constraints

### Couple Code Generation
- 6 uppercase alphanumeric characters
- Excludes ambiguous characters (O, 0, I, 1)
- Generated in application code, not database
- Validated as UNIQUE on INSERT

### Week Start Date
- Always Monday (day 1 of week)
- Calculated in application: `date.setDate(date.getDate() - date.getDay())`
- Format: YYYY-MM-DD

### JSON Schema Validation
- Currently done in application code
- TODO: Add database-level JSON schema validation

---

## Migration History

See `supabase/migrations/` directory for full history.

**Key Migrations:**
- 20250101_create_profiles.sql
- 20250102_create_couples.sql
- 20250103_create_weekly_cycles.sql
- 20250104_create_completions.sql
- 20250105_create_ritual_feedback.sql
- 20250106_create_ritual_preferences.sql
- 20250107_create_ritual_memories.sql
- 20250108_create_ritual_streaks.sql
- 20250109_create_ritual_suggestions.sql
- 20250110_create_ritual_library.sql
- **TODO:** 20250201_add_unique_couple_week.sql

---

## Backup & Recovery

**Automated Backups:** Handled by Supabase (daily)

**Manual Backup:**
```bash
pg_dump -h db.PROJECT_ID.supabase.co -U postgres dbname > backup.sql
```

**Restore:**
```bash
psql -h db.PROJECT_ID.supabase.co -U postgres dbname < backup.sql
```

---

## Performance Considerations

### Query Optimization
- Use indexes on frequently queried columns
- Avoid N+1 queries (use JOINs or batch fetches)
- Paginate large result sets

### JSONB Performance
- JSONB is slower than relational data
- But provides flexibility for evolving schemas
- Use GIN indexes for JSONB search (future)

### Connection Pooling
- Supabase uses PgBouncer automatically
- No need for client-side pooling

---

## Future Database Improvements

1. **Add Unique Constraints:**
   - `weekly_cycles (couple_id, week_start_date)`

2. **Add Partial Indexes:**
   - `WHERE is_active = true`
   - `WHERE agreement_reached = false`

3. **Add JSON Schema Validation:**
   - Validate input/output structure at DB level

4. **Add Materialized Views:**
   - Pre-compute historical statistics
   - Leaderboards, aggregate stats

5. **Add Database-Level Defaults:**
   - Default city based on user location
   - Auto-populate week_start_date

6. **Add Cascade Delete Rules:**
   - When couple deleted, clean up cycles/preferences/etc.

7. **Add Soft Delete:**
   - Instead of DELETE, set `deleted_at` timestamp
