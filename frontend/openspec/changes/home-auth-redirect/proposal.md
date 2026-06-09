# Proposal: GymControl Portal Home

## Intent
Replace the boilerplate Next.js template on `/` with a premium, professional landing portal for GymControl. The portal will serve as the entry gateway for gym staff and administrators, styled with a high-end dark palette (deep red, pitch black, and charcoal gray), featuring smooth hover animations and micro-interactions.

## Scope

### In Scope
- Modify `/app/page.tsx` as a Server Component.
- Check active user authentication state with Supabase server client.
- Implement a modern dark-themed landing portal using Tailwind CSS 4 with:
  - A deep red, black, and dark gray color scheme.
  - Micro-animations and smooth transition gradients.
  - Action cards pointing to `/recepcion/control` (Reception Scanner) and `/admin/socios` (Admin Panel).
  - Contextual authentication indicator: Show "Go to Admin Panel" and "Sign Out" buttons if logged in; show "Staff Login" if logged out.
- Ensure proper SEO titles and meta tags.

### Out of Scope
- Creating new backend API routes.
- Modifying styling of inner dashboard pages.

## Capabilities

### New Capabilities
- `home-portal`: A premium entry landing page at `/` providing navigation to reception scanner and admin sections, styled with custom branding.

### Modified Capabilities
- None

## Approach
Implement a Server Component in `/app/page.tsx` that fetches user data using `createClient()`. If a session exists, render a personalized portal layout with active shortcuts and a sign-out action. If not, render public information cards with a login prompt. Use Tailwind CSS 4's custom color utilities, shadows, and smooth scaling transitions to achieve a premium UI.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/page.tsx` | Modified | Replaces default boilerplate with custom branding and routing portal |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Routing latency on Server Component auth check | Low | Keep server-side rendering fast and simple, leverage cached session cookies |

## Rollback Plan
Run `git checkout app/page.tsx` to restore original file.

## Dependencies
- Supabase project connection via `.env.local` variables.

## Success Criteria
- [ ] Visual page shows a high-end black, charcoal, and red styled portal.
- [ ] Displays the correct auth state and corresponding buttons dynamically.
- [ ] Navigation links to `/admin/socios` and `/recepcion/control` are fully operational.
