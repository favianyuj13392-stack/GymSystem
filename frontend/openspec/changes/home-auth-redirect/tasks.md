# Tasks: GymControl Portal Home

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 80-120 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Core Implementation

- [ ] 1.1 Replace `/app/page.tsx` boilerplate with an async Server Component.
- [ ] 1.2 Import `createClient` from `@/utils/supabase/server` and fetch current user session.
- [ ] 1.3 Implement the main portal dark-themed layout using Tailwind CSS 4 (black, charcoal, deep red accents).
- [ ] 1.4 Create navigation cards for "Terminal de Recepción" pointing to `/recepcion/control`.
- [ ] 1.5 Create navigation cards for "Panel de Administración" pointing to `/admin/socios`.
- [ ] 1.6 Add contextual header: Show "Staff Login" button if guest, show greeting and "Sign Out" button if authenticated.

## Phase 2: Verification

- [ ] 2.1 Verify guest state: Access `/` without cookies, confirm dark portal displays login prompt and links.
- [ ] 2.2 Verify auth state: Log in, access `/`, confirm personalized greeting and direct dashboard shortcuts.
- [ ] 2.3 Verify all links navigate to correct target paths.
