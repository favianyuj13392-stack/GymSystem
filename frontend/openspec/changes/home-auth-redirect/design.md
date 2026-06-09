# Design: GymControl Portal Home

## Technical Approach
Implement a Server Component at `/app/page.tsx` that checks the user's Supabase auth status on the server. Depending on whether a user is logged in, the page displays a custom high-end dark entryway portal (black background, charcoal gray cards, and fire red details) with specific navigation actions.

## Architecture Decisions

### Decision: Server-Side Authentication Verification
- **Choice**: Server Component check using `createClient()` from `@/utils/supabase/server`.
- **Alternatives considered**: Client-side `useEffect` hook check, Middleware routing.
- **Rationale**: Server Component check runs on the server, avoiding any client-side layout flashing (FOUC) and allowing instant redirects or localized greeting rendering. Middleware is kept for generic route group protection.

### Decision: UI Theme and Color Scheme
- **Choice**: Tailored Dark Theme (black, zinc-900, zinc-800, red-600/50).
- **Alternatives considered**: Standard light theme matching the admin panel.
- **Rationale**: User requested a premium dark aesthetic (deep red, black, dark gray) to represent the gym's physical entrance atmosphere (gym brand portal).

## Data Flow

    User Navigates to `/` 
           │
           ▼
    [Server Component: Home] ──→ calls `createClient()` ──→ calls `auth.getUser()`
           │
           ├─→ [If user exists] ──→ Render portal with "Admin Dashboard" & "Sign Out"
           │
           └─→ [If no user]     ──→ Render portal with "Staff Login"

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/page.tsx` | Modify | Replaces boilerplate template with dark portal UI and auth check |

## Interfaces / Contracts
None. The change only leverages existing Supabase client methods.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Authenticated state | Login, navigate to `/`, verify "Go to Dashboard" button appears and redirects to `/admin/socios` |
| Manual | Guest state | Sign out, navigate to `/`, verify "Staff Login" button appears and redirects to `/login` |
| Manual | Navigation links | Verify clicking "Reception Scanner" redirects to `/recepcion/control` |

## Migration / Rollout
No database or data migrations required.
