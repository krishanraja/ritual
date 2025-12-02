# Architecture Documentation

## Technology Stack

### Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3.x with custom design system
- **Animations:** Framer Motion 12.x
- **Routing:** React Router v6
- **State Management:** React Context API + React Query
- **UI Components:** Radix UI primitives + custom shadcn/ui components

### Backend (Lovable Cloud - Supabase)
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth (email/password)
- **Realtime:** Supabase Realtime (presence & database changes)
- **Storage:** Supabase Storage (for future photo uploads)
- **Edge Functions:** Deno runtime
  - `synthesize-rituals` - AI ritual generation
  - `nudge-partner` - Partner reminder system

### AI Integration
- **Provider:** Lovable AI Gateway
- **Models:**
  - `google/gemini-2.5-pro` - Main synthesis (4-5 rituals)
  - `google/gemini-2.5-flash` - Swap ritual generation

### Deployment
- **Platform:** Lovable Cloud
- **Domain:** Custom domain support available
- **CI/CD:** Automatic deployment on code changes
- **Edge:** Global CDN distribution

## Architecture Patterns

### State Management Architecture

```
┌─────────────────────────────────────────┐
│         CoupleContext (Global)          │
│  - user, session                        │
│  - couple, partnerProfile               │
│  - currentCycle                         │
│  - loading state                        │
│  - refreshCouple(), refreshCycle()      │
└────────────┬────────────────────────────┘
             │
             │ provides
             ▼
┌─────────────────────────────────────────┐
│        Page Components                   │
│  - Home, QuickInput, RitualPicker       │
│  - RitualCards, History, Profile        │
└─────────────────────────────────────────┘
```

**Key Design Decision:** Single source of truth in `CoupleContext` with aggressive refresh patterns to ensure state consistency across realtime updates.

### Database Architecture

```
auth.users (Supabase managed)
    │
    ├──→ profiles (public.profiles)
    │      │
    │      └──→ couples (partner_one, partner_two)
    │             │
    │             ├──→ weekly_cycles
    │             │     │
    │             │     ├──→ completions
    │             │     ├──→ ritual_feedback
    │             │     └──→ ritual_preferences
    │             │
    │             ├──→ ritual_memories
    │             ├──→ ritual_streaks
    │             └──→ ritual_suggestions
    │
    └──→ ritual_library (global)
```

**Key Relationships:**
- 1 couple has many weekly_cycles (one per week)
- 1 weekly_cycle has 0-1 feedback, many preferences, many completions
- 1 couple has many memories, 1 streak record, many suggestions

### Realtime Synchronization

The app uses Supabase Realtime to keep partners in sync:

```typescript
// Subscribe to couple changes
supabase
  .channel('couples')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'couples'
  }, handleCoupleChange)
  .subscribe()

// Subscribe to cycle changes
supabase
  .channel('weekly_cycles')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'weekly_cycles'
  }, handleCycleChange)
  .subscribe()
```

**Pattern:** On any change, refresh context and show toast notification to inform user of partner actions.

### Navigation State Machine

The app uses a state machine approach to determine navigation:

```
Couple State → Cycle State → User State → Route

States:
1. No couple → Landing/Create
2. No partner_two → Show Code
3. User hasn't submitted → /input
4. Waiting for partner → Home (waiting component)
5. Both submitted, no synthesis → Home (synthesis animation)
6. Synthesis ready, no agreement → /picker
7. Agreement reached → /rituals
8. Ritual passed → Home (post-checkin)
```

## Component Architecture

### Component Hierarchy

```
App
└── AppShell
    ├── Header (logo, status, join button)
    ├── Main Content (Route)
    │   ├── Landing
    │   ├── Auth
    │   ├── Home
    │   │   ├── WaitingForPartner
    │   │   ├── SynthesisAnimation
    │   │   └── PostRitualCheckin
    │   ├── QuickInput
    │   │   └── MagneticCanvas
    │   ├── RitualPicker
    │   │   ├── RitualCarousel
    │   │   └── AgreementGame
    │   ├── RitualCards
    │   │   └── CelebrationScreen
    │   ├── History
    │   └── Profile
    └── Bottom Nav
```

### Key Component Patterns

**1. Strict Mobile Viewport**
All pages wrapped in `<StrictMobileViewport>` for consistent mobile-first design.

**2. Loading States**
Every async operation shows loading state with timeout-based "slow loading" indicator.

**3. Optimistic Updates**
UI updates immediately, with rollback on error.

**4. Skeleton Loading**
(TODO: Not yet implemented consistently)

## Edge Functions

### synthesize-rituals

**Purpose:** Generate personalized rituals using Lovable AI

**Input:**
```typescript
{
  action: 'synthesize' | 'swap',
  coupleId: string,
  partnerOneInput: { energy, availability, budget, craving, desire },
  partnerTwoInput: { energy, availability, budget, craving, desire },
  userCity: string,
  currentRitual?: object // for swap action
}
```

**Output:**
```typescript
{
  rituals: [{
    title: string,
    description: string,
    time_estimate: string,
    budget_band: string,
    category: string,
    why: string
  }]
}
```

**Key Features:**
- Fetches historical data (completions, memories)
- Avoids repeating past rituals
- Learns from highly-rated experiences
- Location and season aware
- Includes "surprise factor" requirement

### nudge-partner

**Purpose:** Send reminder to partner who hasn't submitted

**Input:**
```typescript
{
  cycleId: string
}
```

**Rate Limit:** Once per hour per cycle

**Output:**
```typescript
{ success: boolean, message: string }
```

**Flow:**
1. Verify user is part of couple
2. Check rate limit (1 hour cooldown)
3. Update `nudged_at` timestamp
4. Partner sees nudge banner on next refresh

## Security Model

### Authentication
- Email/password via Supabase Auth
- Auto-confirm enabled for non-production
- Session persisted in localStorage
- JWT tokens in Authorization header

### Row Level Security (RLS)

**Key Policies:**
- Users can only see their own profile
- Users can see their partner's profile if in active couple
- Users can only access data for couples they're in
- Anyone can view joinable couples (where partner_two IS NULL)
- Partner one can delete couple
- Partner two can leave couple (sets partner_two to NULL)

See [SECURITY.md](./SECURITY.md) for detailed policy documentation.

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:** Routes code-split automatically by Vite
2. **Memoization:** Heavy computations memoized with useMemo
3. **Debouncing:** Input handlers debounced
4. **Realtime Throttling:** Realtime updates batched to prevent UI thrashing
5. **Query Caching:** React Query caches with smart invalidation

### Bundle Size
- Main bundle: ~150KB gzipped
- Lazy routes: 10-30KB each
- Total initial load: <200KB

## Error Handling

### Strategy
1. **Try-Catch Blocks:** All async operations wrapped
2. **Error Boundaries:** Top-level error boundary (TODO)
3. **Fallback UI:** Error states for every component
4. **Logging:** Console logging for debugging
5. **User Feedback:** Toast notifications for errors

### Common Error Patterns
See [ERROR-PATTERNS.md](./ERROR-PATTERNS.md)

## Development Workflow

### Local Development
```bash
npm install
npm run dev  # Starts on localhost:5173
```

### Environment Variables
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

Auto-configured via Lovable Cloud integration.

### Testing
Currently no automated tests. Testing done manually in preview environment.

### Deployment
Automatic on push to main. Edge functions deploy automatically.

## Future Architecture Improvements

1. **Error Boundaries:** Add React error boundaries to all pages
2. **Suspense:** Use React Suspense for loading states
3. **Query Optimization:** Add indexes to frequently-queried columns
4. **Caching Layer:** Add Redis for session/state caching
5. **Monitoring:** Add Sentry or similar for error tracking
6. **Analytics:** Add PostHog or similar for usage analytics
7. **Testing:** Add unit and integration tests
8. **E2E Testing:** Add Playwright for critical flows
