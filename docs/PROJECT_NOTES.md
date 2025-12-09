# Project Notes: Ritual

> **Purpose**: Running decisions log and technical debt tracker. Updated with each significant change.

---

## Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | Ritual |
| **Version** | 1.4.0 |
| **Last Updated** | 2024-12-09 |
| **Status** | Active Development |

---

## Architecture Decisions

### AD-001: State Management
- **Decision**: Use React Context + React Query for state management
- **Date**: Initial setup
- **Rationale**: Simple enough for current scope, React Query handles server state caching
- **Status**: ✅ Implemented

### AD-002: Authentication
- **Decision**: Supabase Auth with email/password
- **Date**: Initial setup
- **Rationale**: Integrated with Lovable Cloud, handles auth flows out of the box
- **Status**: ✅ Implemented

### AD-003: Styling System
- **Decision**: Tailwind CSS + shadcn/ui components + CSS variables for design tokens
- **Date**: Initial setup
- **Rationale**: Consistent design system, easy to customize, good DX
- **Status**: ✅ Implemented

### AD-004: Animation Library
- **Decision**: Framer Motion for page transitions and micro-interactions
- **Date**: Initial setup
- **Rationale**: Best-in-class React animation library, good performance
- **Status**: ✅ Implemented

### AD-005: AI Integration
- **Decision**: Google Gemini via edge functions for ritual synthesis
- **Date**: Initial setup
- **Rationale**: Good quality, integrated with Lovable AI, structured output support
- **Status**: ✅ Implemented

---

## Technical Debt

### TD-001: Missing Error Boundaries
- **Priority**: High
- **Description**: No React error boundaries wrapping routes
- **Impact**: Single component error can crash entire app
- **Action**: Add ErrorBoundary component to wrap routes
- **Status**: 🔴 Open

### TD-002: No Testing Infrastructure
- **Priority**: Medium
- **Description**: No Vitest/Jest setup, no smoke tests
- **Impact**: Regressions can slip through unnoticed
- **Action**: Set up Vitest with basic smoke tests
- **Status**: 🔴 Open

### TD-003: Inconsistent Logging
- **Priority**: Medium
- **Description**: Some edge functions have structured logging, others don't
- **Impact**: Debugging is harder in production
- **Action**: Create shared logging utility for edge functions
- **Status**: 🟡 Partial

### TD-004: Missing Loading Skeletons
- **Priority**: Low
- **Description**: Some data-fetching states show nothing during load
- **Impact**: Poor perceived performance
- **Action**: Add skeleton components for key loading states
- **Status**: 🔴 Open

### TD-005: No Reduced Motion Support
- **Priority**: Low
- **Description**: Animations don't respect prefers-reduced-motion
- **Impact**: Accessibility concern for motion-sensitive users
- **Action**: Add reduced motion media query checks
- **Status**: 🔴 Open

---

## Key Decisions Log

### 2024-12-09: Master Instructions Integration
- Added comprehensive engineering standards via MASTER-INSTRUCTIONS.md
- Created compliance tracking via COMPLIANCE-CHECKLIST.md
- Established this PROJECT_NOTES.md for running decisions

### 2024-12-09: Loading Indicator Enhancement
- Added subtle top loading bar during page transitions
- Uses Framer Motion for smooth scaleX animation
- Primary color at 60% opacity for subtlety

---

## Database Schema Notes

### Core Tables
- `profiles` - User profile data (linked to auth.users)
- `couples` - Couple pairings with codes
- `weekly_cycles` - Weekly ritual cycles with inputs/outputs
- `ritual_preferences` - User ritual rankings per cycle
- `ritual_memories` - Completed ritual history

### Premium/Subscription
- `couples.premium_expires_at` - Premium status tracking
- `couples.stripe_customer_id` - Stripe integration

### Analytics
- `user_analytics_events` - Session-based event tracking
- `user_feedback` - Contextual feedback collection

---

## Environment Variables

### Required (Auto-configured by Lovable Cloud)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Edge Function Secrets
- `GEMINI_API_KEY` - For ritual synthesis
- `STRIPE_SECRET_KEY` - For payments
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhooks
- `RESEND_API_KEY` - For email delivery
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - For push notifications

---

## Performance Notes

- Page transitions kept under 300ms
- React Query cache time: 5 minutes default
- Images optimized for mobile-first
- Edge functions deployed to edge for low latency

---

## Known Issues

1. **Safari iOS**: Some animations may jitter on older devices
2. **PWA**: Service worker needs update for offline ritual viewing
3. **Email**: Some transactional emails may hit spam filters

---

*This document is updated with each significant architectural decision or technical debt item.*
