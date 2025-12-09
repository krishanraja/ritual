# Master Instructions: Vibe-Coded Projects

> **Purpose**: This document defines the engineering, UX, and operational standards for this project. All development must adhere to these principles.

---

## 0. PURPOSE

This project must behave like a world-class engineer, UX designer, and operator in one:

- Fix issues first time, not via endless trial-and-error
- Model the entire pipeline, not single functions
- Produce 10/10 diagnostics and logging before edits
- Never break working flows or overwrite real assets
- Stay general enough to work for any codebase in Lovable

---

## 1. GLOBAL RULES OF ENGAGEMENT

### No Edits Before Scope
- Always do a scope pass first: map the pipeline, list all related files, and call sites
- Output a short plan before changing code

### No Unverified Assumptions
- If something is unclear, log it, inspect it, or surface it to the user instead of guessing

### No Silent Breakages
- Any failure must be visible in logs, UI, or both
- Never swallow errors. Wrap them with context and rethrow or return a safe, flagged result

### No Asset Vandalism
- Never overwrite real images, logos, fonts or brand files with generated ones
- Never resize or crop assets unless explicitly instructed. If you must, preserve aspect ratio

### No "Probably Fixed" Outcomes
Every fix must be proven through:
- logs
- screenshots / screen recordings
- clearly verifiable behavior in the UI

---

## 2. THINK IN SYSTEMS, NOT SINGLE BUGS

### 2.1 Model the Pipeline End-to-End

For any feature or error, always map:
- **Trigger**: what starts the flow (click, route change, cron, webhook, etc)
- **Frontend path(s)**: components, hooks, global state, routing
- **Network layer**: edge functions / APIs, request/response shapes
- **Business logic**: orchestrators, helpers, compute_ functions, branching logic
- **Data**: DB queries, inserts, updates, external APIs
- **Aggregation & UI**: how everything is stitched together and rendered

**Deliverable**: A short call graph:
```
Trigger → Component → Hook/Util → API → Orchestrator → DB/External → Aggregator → UI
```

### 2.2 Enumerate All Failure Points

For each step in the flow, enumerate:
- What can be null, undefined, empty array, or empty object?
- What can throw? (network, schema mismatch, parsing, LLM failure, rate limit, missing env)
- What can be out of date vs deployed code?

Guard all of these:
- Strong type checks where possible
- Runtime defensive checks where necessary
- Default values and fallbacks for every branch

### 2.3 Anti-Fragile Design Rules

Every function that participates in a user-facing flow must:
- Accept defined, well-typed inputs (or validate and fail fast with clear errors)
- Return a predictable shape, even on failure: `{ success: false, error: "...", fallbackUsed: true }`
- Have safe defaults for empty lists, missing sub-fields, partial records
- Never assume downstream objects are populated. Always use safe access and guard clauses

---

## 3. DATA & CONTEXT PRINCIPLES

### 3.1 Profiles as the Anchor

Anchor all meaningful data off stable IDs:
- `profile_id` (user, leader, partner, etc)
- optional `organization_id`
- `session_id` for a visit / workflow run

Any event, insight, or output should link back to at least:
- `profile_id`
- `session_id`
- `tool/flow name`

Never create duplicate profiles if you can match on stable keys (e.g. email + name).
Prefer "lookup then upsert", not blind insert.

### 3.2 Events, Not Blobs

For any interaction (assessment, intake, form, simulation, chatbot step):

Store a raw event row with at minimum:
- `id`
- `profile_id` (if known)
- `session_id`
- `question_id` or `prompt_key` (if applicable)
- `raw_input` (full text / payload)
- `structured_values` (JSON / JSONB)
- `created_at`
- `tool_name` / `flow_name`

**LLM summaries are never the source of truth. Raw input and structured fields are the primary record.**

### 3.3 Meaning Layer (Insights & Scores)

For any analysis flow, add an "insights/scores" layer:

| Field | Description |
|-------|-------------|
| `profile_id` | User identifier |
| `source_event_id` | Link to raw event |
| `dimension_name` | e.g. risk_appetite, momentum |
| `score` | 0–100 or 1–5 |
| `label` | Short classifier |
| `llm_summary` | 1–3 sentences |
| `context_snapshot` | JSON with key inputs |

Decide the core dimensions per project upfront and reuse them everywhere.

### 3.4 Context Linking Across Tools

Whenever you store something, ask: "How do we reuse this later?"

Always link:
- `tool_name` (which tool)
- `question_block` or `section` (e.g. pre_workshop, demo_flow)

### 3.5 Persistence & Safety

**DB changes:**
- Use proper migrations
- Avoid ad-hoc shape changes that silently break existing code

**Validate writes:**
- If an insert or update fails, log and surface an error; don't ignore

**Integrity:**
- Use foreign keys and constraints where the platform allows
- Prefer soft deletes / archival flags over hard deletes for anything user-facing

---

## 4. LLM BEHAVIOR: DATA → INSIGHT → ACTION

LLMs are not parrots. Treat them as analysts with teeth and guardrails.

### 4.1 Always Read Before You Think

Any function that calls an LLM should:
1. Read relevant data first (recent events, current insights/scores, tool context)
2. Build a structured context object:
   - `profileSnapshot`
   - `recentEvents`
   - `existingScores`
   - `toolContext`
   - `constraints` (what must not be broken)

### 4.2 Standard Output Schema

LLM responses for analytical flows should stick to a small, reusable schema:
- `summary`: synthesis, not just recap
- `key_actions`: explicit actions tied to specific inputs or scores
- `surprise_or_tension`: contradictions, blind spots, or non-obvious links
- `scores`: structured array of `{ dimension, score, label }`
- `data_updates`: suggestions for DB changes (never direct SQL)

### 4.3 "10/10" Quality Checks Inside Prompts

Prompt LLMs to self-check before "final":
- **Grounding**: Is the answer clearly tied to provided data?
- **Clear next move**: At least one concrete "do this next" step
- **Useful surprise**: `surprise_or_tension` must say something non-trivial
- **Reusability**: Output must be easy to write back into existing tables or state

### 4.4 Reuse Modes, Don't Reinvent Prompts

Define a small set of LLM "modes" and reuse them:
- `assessment_analyzer`: profile + answers → scores, labels, actions, tension
- `portfolio_analyzer`: list of entities → rankings, flags, route recommendations
- `session_synthesizer`: events → executive summary + short-term path

### 4.5 Guardrails Against Fluff

Hard rules in prompts:
- No generic "communicate more" or "be open to change" style advice
- Tie every recommendation to a specific answer, dimension/score, or tension in the data
- When uncertain, prefer: "Here are two scenarios and what you'd see in each"

---

## 5. FAILURE PATTERNS & HOW TO TREAT THEM

### 5.1 Deployment Desync

**Problem**: dev, preview, and production are not aligned

**Approach**:
- Log live runtime values in the deployed environment
- Compare local code vs deployed behavior carefully
- Maintain backward-compatible payloads during transitions
- Never assume hot reload is serving the latest bundle

### 5.2 Shallow Error Diagnosis

**Problem**: taking "400", "undefined", "invalid argument", etc. at face value

**Approach**:
- Log expected vs actual payload at each hop
- Log config and env values before using them
- Reproduce with minimal payloads
- Fix root cause, not symptoms

### 5.3 Partial Logic Updates

**Problem**: fixing one path but breaking or ignoring others

**Approach**:
- Build a small input→output matrix for the feature
- Verify each output path before calling the fix done
- Keep all branches in sync

### 5.4 UX / Business Intent Blindspots

**Problem**: technically correct fix that ruins user experience

**Approach**:
- Ask: "What is the real outcome we want?"
- Walk the flow like a real user
- Flag mismatches between business intent and current interaction

### 5.5 Structural Layout Failures

**Problem**: tweaking padding/margins when the container structure is wrong

**Approach**:
- Think in layers: page frame → section wrapper → content container → elements
- Use consistent spacing systems, not random values
- Verify at both desktop and mobile widths

### 5.6 Asset Mismanagement

**Problem**: random logos, stretched images, broken branding

**Approach**:
- Always treat uploaded assets as the single source of truth
- Preserve aspect ratio at all times
- If an asset is missing or unreadable, stop and request guidance

---

## 6. MASTER DIAGNOSTIC PROTOCOL

Use this sequence every time you change code for a non-trivial issue.

### PHASE 1: Scope & Mapping

**Goal**: understand exactly what's broken and where

**Checklist**:
- Search for all related functions, hooks, classNames, env vars, error messages
- Map architecture: trigger → component → util → API → orchestrator → DB/external → UI
- Capture console errors, network traces, screenshots
- Identify all conditional branches

**Deliverable**: DIAGNOSIS summary with call graph, file + line references, architecture sketch, observed errors

### PHASE 2: Root Cause Confirmation

**Goal**: confirm real cause, not just the visible complaint

**Functional flows**:
- Trace payloads at each step
- Log runtime env vars used
- Compare expected schema vs actual payloads

**Layout flows**:
- Inspect container hierarchy
- Check for conflicting CSS / utility classes
- Inspect responsiveness

**Deliverable**: ROOT_CAUSE summary with what it is, why it happens, what it affects

### PHASE 3: Implementation Plan with Checkpoints

**Goal**: write the diffs before touching code

**Checkpoints**:
- **CP0**: Plan sanity - changes won't break unrelated flows
- **CP1**: Environment & config - clean build, no type errors
- **CP2**: Core fix - primary flow works
- **CP3**: Secondary impacts - dependent features still work
- **CP4**: Regression pass - run the whole path multiple times

### PHASE 4: Implementation

- Apply changes exactly as per the plan
- After each checkpoint, verify and log
- If any checkpoint fails: stop, update diagnosis, adjust plan

### PHASE 5: Handover

- Keep basic docs current (README, env notes, CHANGELOG)
- If painful bug: add notes to COMMON_ISSUES / troubleshooting doc

---

## 7. PREVENTION CHECKLISTS

### 7.1 Before UI/Layout Changes
- [ ] Audit existing styles for conflicts
- [ ] Use existing design tokens / semantic classes
- [ ] Validate on both desktop and mobile sizes
- [ ] Check interactive elements after layout changes

### 7.2 Before Data/LLM Changes
- [ ] Confirm DB schema and table existence
- [ ] Check that new fields fit the data model
- [ ] Confirm downstream consumers can handle changes

### 7.3 Before Touching Edge Functions / APIs
- [ ] Verify all required secrets/env vars exist
- [ ] Confirm CORS headers and OPTIONS handler are correct
- [ ] Add logging for incoming payload, outbound requests, key branches, error conditions

---

## 8. HOW TO PROMPT / ITERATE INSIDE LOVABLE

- **Prefer incremental changes**: "Add the new card first and test it. Only then wire up the modal"
- **Ask for explicit verification points**: Include console logs or clear UI states
- **Define observable success**: "When I click X, I should see Y and the network tab should show Z"
- **Reset HMR properly**: If behavior is weird, hard refresh, restart dev server, clear cache
- **Default dev states**: In dev, make components visible by default via safe flags
- **Use error boundaries**: Wrap risky components so one failure doesn't crash the whole page

---

## 9. IMMEDIATE ACTIONS WHEN "IT SHOULD WORK"

If something "should work" but doesn't:
1. Hard refresh
2. Clear local cache / storage if relevant
3. Check console for errors or warnings
4. Confirm feature flags / state toggles
5. Restart the dev server if needed
6. Re-run the trigger a few times to check for intermittent issues

If still broken: return to the diagnostic protocol. No more speculative edits.

---

## 10. UNIVERSAL SAFETY CLAUSE

### Do Not:
- Enforce project-specific values unless they already exist
- Rename or delete existing tables, env vars, or core components without explicit instruction
- Switch technology stack decisions already in place

### Always:
- Respect the existing design system and architecture
- Extend instead of rewrite whenever possible
- Make new behavior opt-in and backward-compatible by default

---

## Architecture Foundations (Non-Negotiable)

### Clear Folder Structure
```
/src
  /components    # Reusable UI components
  /pages         # Route components
  /hooks         # Custom React hooks
  /contexts      # React contexts
  /lib           # Core utilities
  /types         # TypeScript types
  /utils         # Helper functions
  /assets        # Static assets
  /integrations  # External service integrations
```

### Code Architecture Rules
- Every component pure unless there's a reason not to
- State lives in as few places as possible
- One data source of truth per feature
- All async functions return a predictable shape: `{ data, error }`
- No untyped returns
- All config goes in one place

### UI Architecture Rules
- Component library mapped and reused
- Design tokens defined: spacing scale, colour palette, border radius, typography
- Shared animations extracted into utilities
- No inline arbitrary styling unless temporary

### API Layer
- All API calls go through one client with interceptors, errors, retries, timeouts
- API responses normalised to the same shape regardless of source

### Database Layer
- Define schema versioning
- Constraints on every table
- Default values everywhere to avoid null cascades
- Migrations documented and reversible

---

## Documentation Standards

- Each file has a header block: what it does, what it depends on, what returns look like
- Every function gets: purpose in one line, inputs, outputs, edge cases
- A global README covering features, architecture, tech stack, API endpoints, DB schema
- A CHANGELOG for every push
- Inline comments only where context is missing from naming

---

## Logging and Diagnostics

- Standard log format: `{ level, message, context, timestamp }`
- Levels: debug, info, warn, error, critical
- All LLM interactions logged with inputs and outputs (safely)
- Every error thrown must have: human readable message, error code, context snapshot
- Add tracing ID per user session

---

## Quality Rules for Output

Never output code without:
- Imports checked
- Component and function naming clean
- No dead branches
- No unused variables
- No implicit any

All code runnable without guessing missing pieces.
All generated components are responsive.
Always generate test data and edge-case tests.

---

## Testing Rules

- Unit tests for utilities and helpers
- Smoke test for each major flow
- Snapshot tests for key components
- API mocks for all external calls
- Regenerate fixtures when schema changes

---

## Deployment Hygiene

### Pre-deploy Checklist
- [ ] Build passes
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Environment variables validated

### Post-deploy
- [ ] Health check
- [ ] Regression check
- [ ] Log scan for anomalies

---

*Last Updated: 2024-12-09*
*Version: 1.0.0*
