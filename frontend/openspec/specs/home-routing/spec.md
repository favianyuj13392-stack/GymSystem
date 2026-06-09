# Home Routing Specification

## Purpose
Define the behavior of the application's landing portal at root path `/`. The system redirects users or displays authentication options based on the active Supabase session.

## Requirements

### Requirement: Authentication Status Check
The root path `/` MUST determine if there is an active authenticated user session via Supabase server-side validation.

#### Scenario: Authenticated User Navigation
- GIVEN an active authenticated user session
- WHEN a user navigates to `/`
- THEN the system MUST render the landing page displaying their session status
- AND the system MUST show direct shortcuts to `Dashboard` and `Sign Out`

#### Scenario: Guest User Navigation
- GIVEN no active authenticated user session
- WHEN a user navigates to `/`
- THEN the system MUST render the landing page in guest mode
- AND the system MUST display a `Staff Login` button linking to `/login`

### Requirement: Landing Portal Navigation
The system MUST provide navigation cards for authorized gym roles to access their respective modules.

#### Scenario: Admin Panel Access
- GIVEN the landing page is rendered
- WHEN a user clicks on the `Admin Panel` card
- THEN the system MUST attempt navigation to `/admin/socios`

#### Scenario: Reception Scanner Access
- GIVEN the landing page is rendered
- WHEN a user clicks on the `Reception Scanner` card
- THEN the system MUST attempt navigation to `/recepcion/control`
