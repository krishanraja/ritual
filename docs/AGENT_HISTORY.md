# AI Agent Session History

This document consolidates all AI agent work sessions on the Ritual codebase, providing a comprehensive history of fixes, features, and architectural decisions.

---

## Session Timeline

| Date | Agent | Focus Area | Key Deliverables |
|------|-------|------------|------------------|
| 2026-01-03 | Claude | Infinite Loading Fix | Service worker, timeouts, retry mechanisms |
| 2025-01-27 | Claude | Mobile UX & Auth | SplashScreen, submit fixes, dialog UX |
| 2025-01-XX | Claude | Adversarial Audit | 10 critical fixes, error boundaries |
| 2025-12-14 | Claude | Branded Loading | RitualSpinner, viewport fixes |
| 2025-12-13 | Claude | SEO & Loading | FAQ page, coordinated loading |
| 2025-12-11 | Claude | Photo Memories | Upload, reactions, notifications |
| 2025-12-09 | Claude | Standards | Master instructions, compliance |

---

## Session: 2026-01-03 - Infinite Loading Screen Fix

### Problem Statement
Users were getting stuck on loading screens with "Creating rituals..." that never completed. This was a recurring issue across multiple user reports.

### Root Causes Identified

| Category | Issue | Impact |
|----------|-------|--------|
| A1 | Service worker caching API responses with stale-while-revalidate | Users see old data, stuck states |
| A2 | No cache busting on deployments | Old code served indefinitely |
| B1 | Both partners submit but synthesis has no timeout | Stuck at "Creating rituals..." |
| B2 | Edge function timeout not handled | Silent failure |
| B3 | No polling fallback when realtime fails | Status never updates |
| C1 | No user-visible error when synthesis fails | Users wait forever |
| C2 | SplashScreen 8s timeout dismisses but shows broken content | False impression |
| D1 | No manual retry on Dashboard | Users stuck with no options |

### Fixes Applied

#### 1. Service Worker - Network-First Strategy
**File:** `public/sw.js`

Changed from stale-while-revalidate to network-first for ALL Supabase API calls. Added version-based cache invalidation and manual cache clearing via postMessage.

```javascript
// Key change: Always fetch from network first
if (event.request.url.includes('supabase.co')) {
  event.respondWith(networkFirst(event.request));
}
```

#### 2. Synthesis Timeout with Auto-Retry
**File:** `src/hooks/useRitualFlow.ts`

- 30-second synthesis timeout tracking
- Auto-retries synthesis once when timeout is hit
- Polling fallback (every 5s) when in generating state
- Exposes `synthesisTimedOut` and `isRetrying` states

#### 3. Landing Page Retry Button
**File:** `src/pages/Landing.tsx`

- "Creating rituals..." card when both partners submit
- Timeout detection (30s) with "Taking Longer Than Expected" error state
- Retry button for manual synthesis trigger

#### 4. SplashScreen Progressive Feedback
**File:** `src/components/SplashScreen.tsx`

```
0-3s:  "Loading your ritual space..."
3-5s:  "Taking a moment..."
5-8s:  "Having trouble?" + Refresh/Continue buttons
8-10s: Amber error styling
10s+:  Force dismiss (guaranteed exit)
```

#### 5. Cache-Control Headers
**File:** `vercel.json`

- `/sw.js`: no-cache, no-store, must-revalidate
- `/index.html`: no-cache, must-revalidate
- `/assets/*`: public, max-age=31536000, immutable

### Verification
- ✅ Production build succeeds with no TypeScript errors
- ✅ All linter checks pass
- ✅ Progressive timeout system tested

---

## Session: 2025-01-27 - Mobile UX & Authentication

### Problems Addressed
1. Loading screen hanging indefinitely
2. Submit button not responding on mobile
3. Leave Couple dialog unusable on mobile
4. Authentication issues after Supabase migration

### Root Causes

#### Loading Screen
- Multiple safety timeouts but no progressive feedback
- SplashScreen fallback insufficient
- Silent auth initialization failures

#### Submit Button
- Silent error handling
- Missing click event logging
- CSS z-index/pointer-events issues
- Event propagation blocked

#### Leave Couple Dialog
- Desktop-first design (max-w-md = 448px > 375px viewport)
- Touch targets too small (<44x44px)
- Keyboard covering inputs

### Fixes Applied

#### SplashScreen Enhancement
```tsx
// Progressive timeout system
useEffect(() => {
  const timer3s = setTimeout(() => setMessage("Taking a moment..."), 3000);
  const timer8s = setTimeout(() => forceComplete(), 8000);
  return () => { clearTimeout(timer3s); clearTimeout(timer8s); };
}, []);
```

#### Submit Button Reliability
- Added comprehensive logging
- Added preventDefault/stopPropagation
- Fixed z-index: `relative z-10`
- Enhanced error display

#### Dialog Mobile-First Redesign
```tsx
// Mobile-first sizing
className="max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
// Touch targets
className="min-h-[44px]"
// Button layout
className="flex flex-col sm:flex-row gap-3"
```

#### Supabase Client Enhancement
**File:** `src/integrations/supabase/client.ts`

- Try-catch around configuration loading
- 10-second timeout on all fetch requests
- Comprehensive logging

---

## Session: 2025-01-XX - Adversarial Audit

### Audit Scope
Two-user, asynchronous, AI-assisted ritual app. Standard: Zero dead ends, zero infinite loaders, zero ambiguous next steps.

### Critical Issues Found (P0)

| # | Issue | Trigger | Fix |
|---|-------|---------|-----|
| 1 | Infinite loader on synthesis | AI takes > 2min | 40 poll attempts max |
| 2 | Orphaned waiting state | User A deletes app | 24h abandonment detection |
| 3 | Timezone week mismatch | Different timezones | Use couple's timezone |
| 4 | No AI failure fallback | AI service down | Sample rituals fallback |
| 5 | Abandoned input detection | User never submits | Cleanup edge function |

### High Priority Issues (P1)

| # | Issue | Fix |
|---|-------|-----|
| 6 | Prompt injection | Sanitize input before AI |
| 7 | Sample rituals forever | Check real cycle exists |
| 8 | Session expiry mid-flow | localStorage backup |
| 9 | Stale cycle after 30 days | Detect and skip old cycles |
| 10 | No error boundaries | React ErrorBoundary |

### Files Created
- `src/components/ErrorBoundary.tsx`
- `supabase/functions/cleanup-orphaned-cycles/index.ts`

### Implementation Details

#### Prompt Injection Protection
```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/ignore previous instructions/gi, '')
    .replace(/system:|assistant:|user:/gi, '')
    .replace(/\[INST\]|\<\|im_start\|\>/gi, '');
}
```

#### Session Recovery
```typescript
// Save on submit
localStorage.setItem('ritual_session', JSON.stringify({
  cycleId,
  submittedAt: Date.now(),
}));

// Restore on mount
const saved = localStorage.getItem('ritual_session');
```

---

## Session: 2025-12-14 - Branded Loading

### Changes Made

#### RitualSpinner Component
Created branded spinner with:
- Pulse animation
- Scale breathing effect
- Rotating gradient border
- Consistent with app identity

#### Multi-Format Favicon
- `favicon.ico` (16x16, 32x32)
- `apple-touch-icon.png` (180x180)
- `favicon-192.png`, `favicon-512.png`
- `manifest.json` for PWA

#### Viewport Fixes
- Memories page empty state fits without scrolling
- Proper flex layouts throughout

---

## Session: 2025-12-13 - SEO & Coordinated Loading

### SEO Implementation

#### FAQ Page (`/faq`)
- 20+ questions with answers
- FAQ Schema for rich snippets
- Target keywords: "weekly rituals for couples", "keep relationship exciting"

#### Blog System
- `/blog` - Article listing
- `/blog/:slug` - Individual articles
- Article Schema structured data
- 6 initial articles (London, Sydney guides, etc.)

#### Technical SEO
- Enhanced `robots.txt` for AI crawlers
- Complete `sitemap.xml`
- Organization, WebApplication, WebSite schemas

### Coordinated Loading

Changed from scattered animations to coordinated reveal:

1. SplashScreen controls initial load
2. Waits for CoupleContext.loading
3. Elements appear all at once
4. No layout shift

---

## Session: 2025-12-11 - Photo Memories & Reactions

### Photo Upload System

#### Client-Side Compression
```typescript
const MAX_SIZE = 500 * 1024; // 500KB target
const compressed = await compressImage(file, {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
});
```

#### Storage Integration
- Bucket: `ritual-photos`
- Path: `{couple_id}/{timestamp}-{uuid}.jpg`
- Retry logic with exponential backoff

### Partner Reactions

#### Database Schema
```sql
CREATE TABLE memory_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES ritual_memories(id),
  user_id UUID NOT NULL,
  reaction TEXT CHECK (reaction IN ('❤️', '🔥', '😍', '🥹', '👏')),
  UNIQUE (memory_id, user_id)
);
```

#### Realtime Updates
Reactions appear instantly for partner via Supabase Realtime.

### Push Notifications

#### notify-partner-completion
```typescript
// Called after ritual completion
await fetch('/functions/v1/notify-partner-completion', {
  method: 'POST',
  body: JSON.stringify({ coupleId, ritualTitle, memoryId }),
});
// Partner receives: "💕 {name} completed '{ritual}' - tap to see!"
```

---

## Session: 2025-12-09 - Engineering Standards

### Master Instructions
Established coding standards in `MASTER-INSTRUCTIONS.md`:
- No-cutoff layout principle
- Flex-based viewport handling
- Error boundary requirements
- Logging standards

### Compliance Tracking
Created `COMPLIANCE-CHECKLIST.md` for auditing:
- Route-by-route compliance
- Component pattern adherence
- Security requirements

### Project Notes
Established `PROJECT_NOTES.md` for:
- Architecture decisions (AD-XXX)
- Technical debt tracking (TD-XXX)
- Decision log with dates

---

## Architectural Decisions Made

### AD-006: Card Draw Input (2025-12-11)
**Decision:** Replace MagneticCanvas with simple tap-to-select mood cards
**Rationale:** MagneticCanvas was fiddly and unintuitive. Card selection is faster (~30s) and more familiar.
**Status:** ✅ Implemented

### AD-007: Photo Memories (2025-12-11)
**Decision:** Client-side compression + Supabase Storage
**Rationale:** Photos drive emotional attachment. Compress to ~500KB for bandwidth.
**Status:** ✅ Implemented

### AD-009: Coordinated Loading (2025-12-13)
**Decision:** React-controlled splash that waits for data
**Rationale:** Eliminates layout shift, provides Google-esque loading experience.
**Status:** ✅ Implemented

### AD-011: Branded Loading (2025-12-14)
**Decision:** Use branded Ritual icon for all loading states
**Rationale:** Reinforces brand identity, eliminates generic AI icons.
**Status:** ✅ Implemented

---

## Technical Debt Addressed

| ID | Issue | Resolution | Date |
|----|-------|------------|------|
| TD-003 | Inconsistent logging | Structured JSON logging in edge functions | 2025-12-11 |
| TD-004 | Missing loading skeletons | Added to Landing, Memories, etc. | 2025-12-13 |
| TD-001 | Missing error boundaries | ErrorBoundary.tsx created | 2025-01-XX |

### Outstanding Debt

| ID | Issue | Priority |
|----|-------|----------|
| TD-002 | No testing infrastructure | Medium |
| TD-005 | No reduced motion support | Low |
| TD-006 | Legacy MagneticCanvas fields | Low |

---

## Files Frequently Modified

These files have been touched across multiple sessions:

| File | Sessions | Notes |
|------|----------|-------|
| `src/contexts/CoupleContext.tsx` | 5+ | Core state, auth, cycle management |
| `src/components/SplashScreen.tsx` | 4 | Progressive timeouts, branding |
| `src/hooks/useRitualFlow.ts` | 4 | Synthesis, submit, timeout |
| `src/pages/Landing.tsx` | 4 | Dashboard state, retry logic |
| `vercel.json` | 2 | Cache headers, security |
| `public/sw.js` | 2 | Caching strategy |

---

## Testing Recommendations

After any session, verify:

1. **Build passes:** `npm run build`
2. **No TypeScript errors**
3. **Core flows work:**
   - Sign up → Create couple → Share code
   - Join couple → Submit input
   - Both submit → Synthesis → Pick ritual
   - Complete ritual → Photo → Reaction
4. **Mobile responsive:** Test on 375px viewport
5. **Timeout handling:** Simulate slow network

---

## Rollback Notes

### Reverting Service Worker Changes
If caching issues persist, revert `public/sw.js` to stale-while-revalidate and remove version busting.

### Reverting SplashScreen
If timeout is too aggressive, increase thresholds in `SplashScreen.tsx`:
- 3s → 5s (first message)
- 8s → 12s (warning)
- 10s → 15s (force dismiss)

---

*This document is updated after each significant AI agent session.*
*Last updated: 2026-01-03*

