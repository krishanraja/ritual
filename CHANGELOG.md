# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed - 2026-01-03

#### Infinite Loading Screen - Comprehensive Fix

This release permanently fixes the recurring issue where users get stuck on loading screens with "Creating rituals..." that never completes.

**Root Causes Identified:**
- Service worker caching API responses (stale-while-revalidate)
- No timeout on synthesis pipeline
- No polling fallback when realtime fails
- No user-visible error recovery

**Fixes Applied:**

1. **Service Worker - Network-First for All API Calls** (`public/sw.js`)
   - Changed from stale-while-revalidate to network-first for ALL Supabase API calls
   - Added version-based cache invalidation (cache busts on each deploy)
   - Added manual cache clearing capability via postMessage
   - Ensures users always get fresh data, with offline fallback

2. **Synthesis Timeout with Auto-Retry** (`src/hooks/useRitualFlow.ts`)
   - Added 30-second synthesis timeout
   - Auto-retries once when timeout is hit
   - Shows user-visible error when synthesis fails
   - Added polling fallback (every 5s) when realtime might be disconnected
   - Exposes `synthesisTimedOut` and `isRetrying` states to UI

3. **Landing Page Retry Button** (`src/pages/Landing.tsx`)
   - Added "Creating rituals..." card when both partners submit
   - Added timeout detection (30s) with "Taking Longer Than Expected" error state
   - Retry button allows users to manually trigger synthesis
   - Auto-triggers synthesis when both partners have submitted

4. **StatusIndicator Timeout** (`src/components/StatusIndicator.tsx`)
   - Added 30-second timeout tracking for "Creating rituals..." state
   - Shows "Tap to retry" when stuck
   - Clickable to navigate to /flow page for more options

5. **SplashScreen Progressive Feedback** (`src/components/SplashScreen.tsx`)
   - At 3s: Changes message to "Taking a moment..."
   - At 5s: Shows "Having trouble?" with Refresh/Continue buttons
   - At 8s: Shows error state with amber styling
   - At 10s: Force dismisses splash (guaranteed exit)

6. **Cache-Control Headers** (`vercel.json`)
   - `/sw.js`: no-cache, no-store, must-revalidate
   - `/index.html`: no-cache, must-revalidate
   - `/assets/*`: immutable caching (hashed filenames)

**Files Modified:**
- `public/sw.js`
- `src/hooks/useRitualFlow.ts`
- `src/pages/Landing.tsx`
- `src/components/StatusIndicator.tsx`
- `src/components/SplashScreen.tsx`
- `vercel.json`

**Verification:**
- Production build succeeds with no TypeScript errors
- All linter checks pass
- Progressive timeout system tested

---

### Fixed - 2025-01-27

#### Mobile UX Fixes
- **Loading Screen Infinite Hang**
  - Added progressive timeout system to SplashScreen (3s warning, 8s critical dismissal)
  - Enhanced CoupleContext loading state diagnostics with multiple safety checkpoints
  - Improved error state handling for failed loads
  - Added comprehensive logging to track loading state transitions
  - Fixed issue where app could hang indefinitely on loading screen

- **Submit & Continue Button Not Working**
  - Added comprehensive logging to submit flow (handleSubmit and submitInput)
  - Fixed button z-index and pointer-events issues
  - Enhanced error display with detailed error messages
  - Added preventDefault/stopPropagation to prevent event propagation issues
  - Improved validation error messages
  - Added performance timing logs for debugging

- **Leave Couple Dialog Mobile UX**
  - Redesigned dialog for mobile-first UX
  - Reduced max-width for mobile viewports (calc(100vw-2rem))
  - Added flexbox layout for better scrolling behavior
  - Improved input field mobile interaction (h-12, text-base)
  - Enhanced countdown timer clarity with descriptive text
  - Ensured buttons meet 44x44px touch target minimum
  - Fixed keyboard behavior (input doesn't get covered)
  - Added proper scroll handling with max-height constraints
  - Improved button layout (flex-col on mobile, flex-row on desktop)

#### Technical Improvements
- Enhanced error logging throughout the application
- Improved timeout handling with progressive feedback
- Better mobile viewport handling in dialogs
- Improved touch target sizes for accessibility

### Changed
- SplashScreen timeout increased from 4s to 8s with progressive warnings
- Dialog component now uses flexbox layout for better mobile scrolling
- Submit button error handling now displays errors prominently

### Files Modified
- `src/components/SplashScreen.tsx`
- `src/contexts/CoupleContext.tsx`
- `src/components/ritual-flow/InputPhase.tsx`
- `src/hooks/useRitualFlow.ts`
- `src/components/LeaveConfirmDialog.tsx`
- `src/components/ui/dialog.tsx`

---

## Previous Changes

[Previous changelog entries would go here]

