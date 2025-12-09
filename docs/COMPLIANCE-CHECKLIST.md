# Compliance Checklist: Master Instructions

> **Purpose**: Track compliance status against Master Instructions. Updated after each audit.

---

## Last Audit Date: 2024-12-09

---

## Section 1: Global Rules of Engagement

| Requirement | Status | Notes |
|-------------|--------|-------|
| Scope pass before edits | ✅ Compliant | Documented in workflow |
| No unverified assumptions | ✅ Compliant | Using TypeScript strict mode |
| No silent breakages | 🟡 Partial | Need error boundaries |
| No asset vandalism | ✅ Compliant | Assets in dedicated folders |
| Verified outcomes | ✅ Compliant | Using console/network debugging |

---

## Section 2: Systems Thinking

| Requirement | Status | Notes |
|-------------|--------|-------|
| Pipeline mapping | ✅ Compliant | ARCHITECTURE.md documents flows |
| Failure point enumeration | 🟡 Partial | Need more defensive checks |
| Anti-fragile design | 🟡 Partial | Some functions lack fallbacks |
| Safe defaults | 🟡 Partial | Some edge cases unhandled |

---

## Section 3: Data & Context Principles

| Requirement | Status | Notes |
|-------------|--------|-------|
| Profile anchoring | ✅ Compliant | user_id on all tables |
| Events not blobs | ✅ Compliant | Structured event tables |
| Meaning layer | ✅ Compliant | ritual_feedback, scores exist |
| Context linking | ✅ Compliant | couple_id links all data |
| Persistence safety | ✅ Compliant | Migrations used |

---

## Section 4: LLM Behavior

| Requirement | Status | Notes |
|-------------|--------|-------|
| Read before think | ✅ Compliant | synthesize-rituals reads history |
| Standard output schema | ✅ Compliant | JSON schema enforced |
| Quality checks in prompts | ✅ Compliant | Prompts include validation |
| Reuse modes | ✅ Compliant | Single synthesis mode |
| Guardrails against fluff | ✅ Compliant | Specific prompts |

---

## Section 5: Failure Patterns

| Requirement | Status | Notes |
|-------------|--------|-------|
| Deployment desync awareness | ✅ Compliant | Proper versioning |
| Deep error diagnosis | ✅ Compliant | Edge function logging |
| Complete logic updates | ✅ Compliant | Full flow testing |
| UX intent awareness | ✅ Compliant | USER-FLOWS.md exists |
| Structural layout | ✅ Compliant | Design system in place |
| Asset management | ✅ Compliant | Dedicated asset handling |

---

## Section 6: Diagnostic Protocol

| Requirement | Status | Notes |
|-------------|--------|-------|
| Scope & mapping phase | ✅ Compliant | Documented process |
| Root cause confirmation | ✅ Compliant | Logging in place |
| Implementation checkpoints | ✅ Compliant | Step-by-step approach |
| Handover documentation | ✅ Compliant | CHANGELOG exists |

---

## Section 7: Prevention Checklists

| Requirement | Status | Notes |
|-------------|--------|-------|
| UI/layout change checklist | ✅ Compliant | Design system enforced |
| Data/LLM change checklist | ✅ Compliant | Migration workflow |
| Edge function checklist | 🟡 Partial | Some missing logging |

---

## Architecture Foundations

| Requirement | Status | Notes |
|-------------|--------|-------|
| Clear folder structure | ✅ Compliant | Standard React structure |
| Pure components | ✅ Compliant | Hooks extract logic |
| State centralization | ✅ Compliant | React Query + Context |
| Predictable async returns | 🟡 Partial | Some inconsistencies |
| Design tokens | ✅ Compliant | CSS variables in index.css |
| API layer | ✅ Compliant | Supabase client |
| Database constraints | ✅ Compliant | RLS policies |

---

## Documentation Standards

| Requirement | Status | Notes |
|-------------|--------|-------|
| File header blocks | 🔴 Non-compliant | Not implemented |
| Function documentation | 🟡 Partial | Key functions documented |
| Global README | ✅ Compliant | docs/README.md |
| CHANGELOG | ✅ Compliant | docs/CHANGELOG.md |
| Inline comments | ✅ Compliant | Where needed |

---

## Logging and Diagnostics

| Requirement | Status | Notes |
|-------------|--------|-------|
| Standard log format | 🟡 Partial | Edge functions only |
| Log levels | ✅ Compliant | Using console methods |
| LLM interaction logging | ✅ Compliant | synthesize-rituals logs |
| Error context | 🟡 Partial | Some errors lack context |
| Session tracing | 🟡 Partial | Via analytics events |

---

## Quality Rules

| Requirement | Status | Notes |
|-------------|--------|-------|
| Clean imports | ✅ Compliant | TypeScript enforced |
| No dead branches | ✅ Compliant | ESLint rules |
| No unused variables | ✅ Compliant | ESLint rules |
| No implicit any | ✅ Compliant | TypeScript strict |
| Responsive components | ✅ Compliant | Mobile-first design |

---

## Testing Rules

| Requirement | Status | Notes |
|-------------|--------|-------|
| Unit tests | 🔴 Non-compliant | No test setup |
| Smoke tests | 🔴 Non-compliant | No test setup |
| Snapshot tests | 🔴 Non-compliant | No test setup |
| API mocks | 🔴 Non-compliant | No test setup |

---

## Deployment Hygiene

| Requirement | Status | Notes |
|-------------|--------|-------|
| Build passes | ✅ Compliant | CI checks |
| Lint passes | ✅ Compliant | ESLint configured |
| Typecheck passes | ✅ Compliant | TypeScript strict |
| Health check | ✅ Compliant | Via preview |
| Rollback plan | 🟡 Partial | Git-based only |

---

## Summary

| Category | Compliant | Partial | Non-compliant |
|----------|-----------|---------|---------------|
| Total | 38 | 12 | 5 |
| Percentage | 69% | 22% | 9% |

---

## Priority Action Items

### High Priority
1. **Add Error Boundaries** - Prevent single component crashes from taking down the app
2. **Set up Testing Infrastructure** - Vitest with basic smoke tests

### Medium Priority
3. **Standardize Logging** - Shared logger utility for frontend and edge functions
4. **Add File Header Blocks** - Documentation for all major files
5. **Improve Error Context** - Wrap errors with more context

### Low Priority
6. **Add Loading Skeletons** - Better perceived performance
7. **Reduced Motion Support** - Accessibility improvement
8. **Session Tracing** - Better debugging in production

---

*Next audit scheduled: After major feature completion*
