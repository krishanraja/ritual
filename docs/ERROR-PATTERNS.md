# Error Patterns & Lessons Learned

This document captures critical failure patterns encountered during development and their resolutions. These lessons inform future development and prevent regression.

---

## Pattern 1: Deployment Desync

**Failure:** Writing code assuming dev server, preview, and deployed instance are aligned.

**Symptom:**
- Feature works in dev
- Breaks in production
- "But it worked on my machine!"

**Root Cause:**
- HMR (Hot Module Replacement) misses updates
- Old bundles cached in browser
- Backend deployed separately from frontend
- Stale environment variables

**Resolution:**
1. **Force Refresh on Mount:** Add aggressive data fetching in `useEffect` hooks
```typescript
useEffect(() => {
  if (couple?.id && !loading) {
    refreshCycle(); // Force refresh, don't trust cache
  }
}, []); // Run once on mount
```

2. **Log Runtime Values:** Console log actual data to verify what's loaded
```typescript
console.log('[HOME] Current cycle:', currentCycle);
console.log('[HOME] User state:', { userSubmitted, partnerSubmitted });
```

3. **Backward-Compatible Payloads:** During transitions, support old and new data shapes

4. **Hard Refresh Instructions:** Tell users to hard refresh (Cmd+Shift+R / Ctrl+F5) when stuck

**Prevention:**
- Never trust HMR for state changes
- Always test in production preview before marking done
- Add version numbers to API responses for debugging

---

## Pattern 2: Shallow Error Diagnosis

**Failure:** Accepting "400", "undefined", or "invalid argument" at face value.

**Symptom:**
- User reports "It's not working"
- Error message is vague
- Can't reproduce issue

**Root Cause:**
- No payload inspection
- No trace of actual data flow
- Missing error boundaries

**Resolution:**
1. **Log Expected vs Actual:**
```typescript
console.log('Expected:', expectedValue);
console.log('Actual:', actualValue);
console.log('Type:', typeof actualValue);
```

2. **Print Config/Env Before Use:**
```typescript
const apiKey = Deno.env.get('LOVABLE_API_KEY');
console.log('API Key exists:', !!apiKey);
if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');
```

3. **Reproduce with Minimal Payloads:** Strip down to simplest failing case

4. **Never Fix Symptoms:** Trace to source before changing code

**Prevention:**
- Add structured logging at every data transformation
- Use TypeScript strict mode
- Add validation at system boundaries

---

## Pattern 3: Week Boundary Bug

**Failure:** State routing logic rigidly matched `week_start_date` to current week.

**Symptom:**
- User submits input on Sunday (Nov 30)
- Monday rolls around (Dec 2, new week)
- User sees "Ready for This Week?" instead of their submitted state
- App appears broken, data "lost"

**Root Cause:**
```typescript
// Old logic
const weekStart = calculateWeekStart(new Date()); // Dec 2
const { data } = await supabase
  .from('weekly_cycles')
  .eq('week_start_date', weekStart) // No match! Cycle was Nov 24
  .maybeSingle();

// data = null → currentCycle = null → Wrong state
```

**Resolution:**
Changed `fetchCycle` to look for **most recent incomplete cycle** first:
```typescript
// New logic
const { data: incompleteCycle } = await supabase
  .from('weekly_cycles')
  .eq('couple_id', coupleId)
  .or('synthesized_output.is.null,agreement_reached.eq.false')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

// Falls back to week_start_date only if no incomplete cycle
```

**Key Lesson:** Don't derive state from calculated dates. Use actual data state (completion flags, timestamps).

**Prevention:**
- Base routing on data state, not calculated values
- Test across date boundaries (midnight, week change, month change)
- Add database queries to test suite

---

## Pattern 4: Duplicate Cycle Creation

**Failure:** Multiple `weekly_cycle` records created for same couple + week.

**Symptom:**
- User sees wrong cycle data
- Partner's input appears missing
- Historical data fragmented

**Root Cause:**
- No unique constraint on `(couple_id, week_start_date)`
- Race condition: Both partners create cycle simultaneously
- Refresh logic creates new cycle instead of finding existing

**Resolution:**
1. **Add Database Constraint:**
```sql
ALTER TABLE weekly_cycles 
ADD CONSTRAINT unique_couple_week 
UNIQUE (couple_id, week_start_date);
```

2. **Upsert Pattern:**
```typescript
const { data, error } = await supabase
  .from('weekly_cycles')
  .upsert({
    couple_id: coupleId,
    week_start_date: weekStart,
    // ... other fields
  }, {
    onConflict: 'couple_id,week_start_date'
  });
```

3. **Cleanup Job:** Delete duplicate cycles (keep most recent)

**Prevention:**
- Add unique constraints at database level
- Use upsert operations for idempotency
- Test with concurrent users

---

## Pattern 5: Realtime Race Conditions

**Failure:** Partner's action triggers realtime update, but UI doesn't sync correctly.

**Symptom:**
- Partner submits input
- User sees toast "Partner submitted!"
- But UI still shows "waiting" state
- Requires manual refresh

**Root Cause:**
- Realtime fires before database write completes
- Context state updates, but component doesn't re-render
- Navigation happens before state settles

**Resolution:**
1. **Add Delay After Refresh:**
```typescript
const handleCycleChange = async () => {
  await refreshCycle();
  await new Promise(resolve => setTimeout(resolve, 500)); // Let state settle
  // Now navigate
};
```

2. **Optimistic Updates with Rollback:**
```typescript
// Update UI immediately
setCurrentCycle(prev => ({ ...prev, partner_two_input: newInput }));

// Then validate
const { data } = await supabase
  .from('weekly_cycles')
  .select('*')
  .eq('id', cycleId)
  .single();

// Rollback if mismatch
if (data.partner_two_input !== newInput) {
  setCurrentCycle(data);
}
```

3. **Status Indicators:** Show "Syncing..." states

**Prevention:**
- Use optimistic updates everywhere
- Add loading/syncing indicators
- Test with network throttling

---

## Pattern 6: Toast Fatigue

**Failure:** Excessive use of toast notifications for every action.

**Symptom:**
- Toasts overlay on toast
- Users ignore all toasts
- Important notifications missed
- Poor UX, feels spammy

**Root Cause:**
- Toasts used for both system status and user feedback
- No distinction between info, success, warning, error
- Toasts persist through navigation

**Resolution:**
1. **Reserve Toasts for:**
   - Critical errors only
   - Partner notifications (realtime)
   - Background actions (like "Code copied")

2. **Use In-Context Feedback:**
```tsx
// ❌ Don't use toast for form submission
toast({ title: "Saved!" });

// ✅ Show inline success state
{isSaved && <Badge variant="success">Saved</Badge>}
```

3. **Inline Notifications:**
```tsx
// For partner actions
<div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
  <p className="text-sm">
    <span className="font-semibold">{partnerName}</span> is ready!
  </p>
</div>
```

**Prevention:**
- Minimize toast usage
- Prefer in-context, inline feedback
- Use toasts only for background/async actions

---

## Pattern 7: Stale Navigation Logic

**Failure:** `getThisWeekRoute()` in `AppShell.tsx` had complex conditional logic that didn't match actual app state.

**Symptom:**
- Clicking "This Week" nav item goes to wrong page
- User gets confused about where they are in flow
- Navigation feels unreliable

**Root Cause:**
- Logic duplicated between `Home.tsx` and `AppShell.tsx`
- Different conditions evaluated at different times
- Tight coupling between nav and page logic

**Resolution:**
Simplified to return the route that represents "current state":
```typescript
const getThisWeekRoute = () => {
  if (!couple || !couple.partner_two) return '/home';
  if (!currentCycle) return '/input';
  
  // Use actual state flags, not derived calculations
  if (currentCycle.agreement_reached) return '/rituals';
  if (currentCycle.synthesized_output) return '/picker';
  return '/home';
};
```

**Prevention:**
- Single source of truth for state
- Navigation logic mirrors page-level checks
- Test all nav paths manually

---

## Pattern 8: Unhandled synthesized_output Structure

**Failure:** Historical views (`History.tsx`) assumed `synthesized_output` was always an array.

**Symptom:**
- History page crashes when loading old cycles
- Error: "Cannot map over undefined"

**Root Cause:**
- Early versions stored different data shapes
- Migration didn't normalize existing data
- No defensive coding

**Resolution:**
```typescript
// ❌ Fragile
const rituals = cycle.synthesized_output.map(r => r.title);

// ✅ Defensive
const rituals = Array.isArray(cycle.synthesized_output) 
  ? cycle.synthesized_output 
  : [];
```

**Prevention:**
- Always validate data shape
- Add migrations for schema changes
- Use TypeScript for compile-time safety

---

## Pattern 9: Missing Loading States

**Failure:** No skeleton loading or spinners during async operations.

**Symptom:**
- White screen flash
- User doesn't know if app is working
- Feels slow even when fast

**Resolution:**
```tsx
{isLoading ? (
  <Skeleton className="h-12 w-full" />
) : (
  <ActualContent />
)}
```

**Prevention:**
- Add loading state to every async component
- Use Suspense boundaries (future)
- Design skeleton states alongside components

---

## Pattern 10: Dual-Submit Race → No Synthesis Trigger (Infinite “Reading your vibes…”)

**Failure:** Synthesis is only triggered by the client that detects “both inputs exist”. If both partners submit within a short window, each client may check for the other input *before it commits*, causing both to skip synthesis.

**Symptom:**
- Both partners completed weekly input
- Dashboard switches to the synthesis loading screen (`Reading your vibes…`)
- The loading animation continues indefinitely (no navigation to `/picker`)

**Root Cause:**
- Submission flow is optimistic + time-sensitive:
  - Save own input
  - Immediately fetch cycle and check for partner input
- When both submits happen nearly simultaneously, both checks can see partner input as null and take the “waiting” branch.
- No server-side trigger exists to synthesize later.

**Resolution:**
1. Add a **reliable backstop** inside the synthesis loading UI:
   - If both inputs are present but `synthesized_output` is still null, the loading screen triggers `synthesize-rituals`.
2. Guard the DB write with `synthesized_output IS NULL` to avoid overwriting if multiple clients trigger.

**Prevention:**
- Treat synthesis as **idempotent** and ensure there is always *at least one* place that triggers it once the prerequisites are met:
  - Client backstop (current)
  - Preferably a server-side job/trigger (future) if reliability requirements increase
- Avoid single-point “edge-triggered” logic for critical transitions; add an “eventually consistent” path.

---

## Critical Debugging Checklist

When a bug is reported:

1. ☐ Can you reproduce it locally?
2. ☐ Can you reproduce it in production?
3. ☐ What's in the console logs?
4. ☐ What's in the network tab?
5. ☐ What's the actual database state?
6. ☐ What does the user's session look like?
7. ☐ Is it a timing issue (race condition)?
8. ☐ Is it a caching issue (stale data)?
9. ☐ Is it a boundary issue (date/time/week change)?
10. ☐ Is it a data shape issue (old vs new format)?

**If you can't answer all 10, you don't understand the bug yet. Keep digging.**

---

## Refactoring Principles Learned

1. **Data State > Calculated State:** Base logic on actual data, not derived values
2. **One Source of Truth:** Don't duplicate state logic across components
3. **Defensive Coding:** Always validate data shapes and handle edge cases
4. **Aggressive Logging:** Log everything during development, strip for production
5. **Test Boundaries:** Date changes, midnight, week rollover, month end
6. **Simplify Navigation:** Complex routing = source of bugs
7. **Minimize External Dependencies:** Every dependency is a potential failure point
8. **Prefer Inline Feedback:** Toasts for background only, inline for everything else

---

## Future Error Prevention

1. **Add Error Boundaries:** Catch React errors gracefully
2. **Add Sentry:** Capture production errors automatically
3. **Add E2E Tests:** Test critical flows end-to-end
4. **Add Database Triggers:** Prevent invalid states at DB level
5. **Add Health Checks:** Monitor system health
6. **Add Feature Flags:** Roll out changes incrementally
7. **Add Rollback Plan:** Always have a way to undo
