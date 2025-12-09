# Ritual - Weekly Rituals for Couples

## Purpose

Ritual helps couples build meaningful weekly rituals together through a simple 2-minute sync. Instead of letting connection time slip away, Ritual makes relationship maintenance effortless and fun.

## Mission

Make relationship maintenance effortless and fun by providing couples with personalized, actionable weekly rituals that fit their real-life constraints.

## Vision

Become the #1 app for couples to stay connected through shared experiences, helping millions of couples maintain strong relationships through consistent, meaningful rituals.

## Target Users

- Couples in committed relationships (any stage)
- Busy professionals who want structured connection time
- Long-distance couples seeking shared experiences
- Couples looking to break routine and try new things together

## Core Value Proposition

**The Problem:** Couples want to spend quality time together but often don't know what to do, or planning feels like work.

**The Solution:** A 2-minute weekly sync that generates personalized ritual options based on:
- Energy levels
- Time availability
- Budget constraints
- Current cravings & desires
- Location and season
- Past experiences

## Key Features

### 1. **2-Minute Weekly Sync**
Each partner independently answers 4-5 quick questions about their week ahead. The app synthesizes both inputs to create personalized rituals.

### 2. **AI-Powered Ritual Generation**
Uses Lovable AI to create 4-5 unique ritual options that:
- Match both partners' constraints
- Consider location and season
- Learn from past experiences
- Surprise with creative ideas

### 3. **Agreement Flow**
Partners vote on their top 3 choices. The app finds overlap and helps couples agree on one ritual with scheduled date/time.

### 4. **Ritual Tracking**
- View upcoming ritual details
- Download ICS calendar events
- Track completion streaks
- Save memories with photos and notes

### 5. **Historical Learning**
The app learns from:
- Completed rituals
- Rated experiences (1-5 stars)
- Written reflections
- What worked and what didn't

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Lovable Cloud (Supabase)
- **AI:** Lovable AI (Gemini 2.5 Pro/Flash)
- **Realtime:** Supabase Realtime
- **Animations:** Framer Motion

## Quick Start

1. Create an account or sign in
2. Create a new ritual space or join with a partner code
3. Wait for your partner to join
4. Complete your weekly input (2 minutes)
5. Wait for synthesis and partner voting
6. Agree on a ritual and schedule it
7. Complete your ritual and share feedback

## Project Structure

```
ritual/
├── docs/              # Comprehensive documentation
├── src/
│   ├── components/    # React components
│   ├── pages/         # Route pages
│   ├── contexts/      # React contexts (CoupleContext)
│   ├── hooks/         # Custom hooks
│   ├── integrations/  # Supabase client & types
│   └── utils/         # Utility functions
├── supabase/
│   └── functions/     # Edge functions
└── public/            # Static assets
```

## Documentation

### Core Standards
- [Master Instructions](./MASTER-INSTRUCTIONS.md) - Engineering standards and principles
- [Project Notes](./PROJECT_NOTES.md) - Running decisions and technical debt
- [Compliance Checklist](./COMPLIANCE-CHECKLIST.md) - Standards compliance tracking

### Technical Documentation
- [Architecture](./ARCHITECTURE.md) - Technical architecture and stack
- [User Flows](./USER-FLOWS.md) - User journey documentation
- [Design System](./DESIGN-SYSTEM.md) - Design guidelines
- [Database](./DATABASE.md) - Database schema
- [API](./API.md) - Edge function documentation
- [Error Patterns](./ERROR-PATTERNS.md) - Lessons learned
- [Security](./SECURITY.md) - Security documentation
- [Handoff](./HANDOFF.md) - Developer setup guide
- [Changelog](./CHANGELOG.md) - Version history
- [Roadmap](./ROADMAP.md) - Future features

## Core Principles

### 1. Radical Simplicity
- Minimal input required from users
- Clear, linear flows with no wandering
- Smart defaults everywhere

### 2. Partner Synchronization
- Both partners see the same state
- Realtime updates when partner acts
- Clear waiting states

### 3. Constraint-Based Design
- Users tell us their constraints
- We generate options within those bounds
- No overwhelming choice paralysis

### 4. Learning System
- Track what works
- Avoid repeating rituals
- Double down on highly-rated themes

### 5. Location-Aware
- All rituals tailored to user's city
- Season and time-of-day appropriate
- Authentic local experiences

## Success Metrics

- **Engagement:** % of couples completing weekly input
- **Completion:** % of agreed rituals actually completed
- **Satisfaction:** Average rating of completed rituals
- **Retention:** Weekly active couple rate
- **Streak:** Average current streak length

## Contact & Support

For questions, issues, or feature requests, contact the development team or file an issue in the project repository.

---

Built with ❤️ for couples everywhere.
