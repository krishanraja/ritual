# Product Roadmap

## Vision

Become the #1 app for couples to maintain strong relationships through consistent, meaningful rituals.

---

## Current Status (v1.7.0) - January 2026

### ✅ Completed Features

#### Core Experience
- ✅ Weekly ritual cycle with card-based input
- ✅ AI-powered ritual generation (Gemini 2.5)
- ✅ Partner synchronization via realtime
- ✅ Historical learning from past rituals
- ✅ Post-ritual feedback and ratings
- ✅ Streak tracking with visual badges
- ✅ Location-aware rituals (city, season, time)

#### Photo Memories (v1.6)
- ✅ Photo upload in post-ritual check-in
- ✅ Client-side compression (~500KB)
- ✅ Photo gallery in Memories page
- ✅ Partner emoji reactions on memories

#### Push Notifications (v1.6)
- ✅ "Partner completed ritual" notification
- ✅ Web Push API implementation
- ✅ VAPID authentication

#### SEO & Content (v1.6.3)
- ✅ FAQ page with schema markup
- ✅ Blog system with articles
- ✅ Comprehensive sitemap
- ✅ Structured data (Organization, WebApplication)

#### Reliability (v1.7.0)
- ✅ Network-first service worker
- ✅ Progressive timeout system
- ✅ Synthesis auto-retry
- ✅ Polling fallback for realtime
- ✅ Error boundaries
- ✅ Session recovery

---

## Q1 2026 - Stability & Growth

### v1.7.x - Reliability Hardening
**Goal:** Zero infinite loaders, zero dead ends

**Completed:**
- ✅ Service worker network-first strategy
- ✅ 30-second synthesis timeout
- ✅ Progressive splash screen timeouts
- ✅ Retry mechanisms throughout

**Remaining:**
- [ ] Comprehensive test suite (Vitest)
- [ ] E2E tests with Playwright
- [ ] Performance monitoring (Web Vitals)
- [ ] Error tracking (Sentry integration)

**Metrics:**
- Error rate < 0.1%
- Synthesis success rate > 99%
- No user-reported infinite loaders

### v1.8 - Onboarding Optimization
**Goal:** Reduce time from signup to first ritual

**Features:**
- [ ] Interactive onboarding tutorial
- [ ] Explainer animation on landing
- [ ] Sample ritual preview (before signup)
- [ ] Partner invitation flow improvements
- [ ] Email reminders to complete setup

**Metrics:**
- Signup → First input: < 3 minutes
- Partner join rate > 70%

---

## Q2 2026 - Engagement & Retention

### v1.9 - Smart Suggestions
**Goal:** Proactive ritual ideas based on patterns

**Features:**
- [ ] AI suggestions on Home page
- [ ] "Based on your history..." recommendations
- [ ] Seasonal ritual ideas
- [ ] Anniversary/special date suggestions
- [ ] "Try something new" prompts

**Algorithm:**
- Analyze completion patterns
- Identify highly-rated themes
- Detect ruts (repeating same category)
- Surface underused categories

**Metrics:**
- Suggestion acceptance rate > 30%
- Diversity of ritual categories

### v2.0 - Insights Dashboard
**Goal:** Help couples understand their patterns

**Features:**
- [ ] Ritual category breakdown chart
- [ ] Completion heatmap calendar
- [ ] Favorite activities ranking
- [ ] Mood trends over time
- [ ] Streak history visualization

**Metrics:**
- Insights page engagement > 50%
- Retention lift from data visibility

---

## Q3 2026 - Monetization

### v2.1 - Premium Features
**Goal:** Sustainable business model

**Free Tier:**
- 4 ritual options per week
- Basic history
- Standard AI generation

**Premium ($9.99/month):**
- [ ] Unlimited ritual options
- [ ] Advanced AI (longer, more detailed)
- [ ] Priority synthesis (faster queue)
- [ ] Unlimited photo storage
- [ ] Insights dashboard
- [ ] Anniversary reminders
- [ ] Export data (PDF/CSV)
- [ ] Custom ritual templates

**Metrics:**
- Conversion rate > 5%
- Churn rate < 3%/month
- LTV > $60

### v2.2 - Ritual Templates
**Goal:** Faster planning with proven formats

**Features:**
- [ ] Save custom templates
- [ ] Share templates with partner
- [ ] Curated community templates
- [ ] Ritual series (multi-week plans)
- [ ] Seasonal bundles

**Examples:**
- "Date Night Formula"
- "Weekend Adventure Template"
- "Cozy Night In"
- "Anniversary Special"

---

## Q4 2026 - Platform Expansion

### v2.3 - Mobile Apps
**Goal:** Native iOS and Android apps

**Features:**
- [ ] React Native or Flutter app
- [ ] Native push notifications
- [ ] Offline support
- [ ] Camera integration
- [ ] Calendar integration (native)
- [ ] Widgets

**Metrics:**
- App store ratings > 4.5
- Mobile engagement > web

### v2.4 - Integrations
**Goal:** Fit into couples' existing workflows

**Features:**
- [ ] Native calendar sync (Google, Apple)
- [ ] Spotify playlist integration
- [ ] Restaurant booking (OpenTable)
- [ ] Ticket booking (Eventbrite)
- [ ] Weather-aware suggestions

---

## 2027 - Social & Scale

### v3.0 - Community Features (Optional)
**Goal:** Build community without compromising intimacy

**Features:**
- [ ] Anonymous ritual sharing
- [ ] City-specific ritual boards
- [ ] Rate/comment on others' ideas
- [ ] Private couple groups (friends)

**Privacy-First:**
- All sharing opt-in
- No real names unless chosen
- No photos shared without consent

### v3.1 - Advanced AI
**Goal:** Truly personalized, evolving suggestions

**Features:**
- [ ] Natural language input
- [ ] Multi-turn conversation
- [ ] Personality profiling
- [ ] Conflict-aware suggestions
- [ ] Long-term goal tracking

---

## Backlog Ideas

### Gamification
- Badges for milestones
- Leaderboards (opt-in)
- Challenges (try all categories)
- Surprise rewards

### Therapy Integration
- Licensed therapist rituals
- Relationship check-in prompts
- Conflict resolution rituals

### Gift Ideas
- Generate gift ideas from history
- Anniversary suggestions
- Affiliate partnerships

### Long-Distance Mode
- Virtual ritual options
- Video call integration
- Async ritual completion
- Countdown to next visit

### Group Rituals
- Double dates
- Family rituals
- Friend group activities

---

## Success Metrics

### North Star Metric
**Weekly Active Couples (WAC)**

### Supporting Metrics

**Engagement:**
- % of couples completing weekly input
- % of rituals actually completed
- Average rating of completed rituals

**Retention:**
- 7-day retention > 60%
- 30-day retention > 40%
- 90-day retention > 25%

**Growth:**
- New couple signups per week
- Partner join rate > 70%
- Viral coefficient > 1.0

**Revenue (future):**
- Free → Premium conversion > 5%
- Churn rate < 3%/month
- LTV:CAC ratio > 3:1

---

## Open Questions

1. **Should we expand beyond couples?**
   - Friends, family, solo rituals?
   
2. **How much community vs privacy?**
   - Balance sharing with intimacy
   
3. **What's the right pricing?**
   - Freemium vs paid-only?
   
4. **Should we build mobile apps?**
   - PWA vs native iOS/Android
   
5. **International expansion?**
   - More cities, languages?

---

## Feedback & Ideas

Have ideas for future features? Reach out:
- **Email:** feedback@ritual.app
- **Twitter:** @ritual_app

We'd love to hear from you!

---

*Last updated: January 2026*
