# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

