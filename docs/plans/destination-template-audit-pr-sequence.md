# Destination Template Audit PR Sequence

## Scope and guardrails

- Template scope: Destination Major only (`src/templates/destination-major/**` and Destination private/mockup data when explicitly needed).
- Do not change Community or Performance behavior, styling, data transforms, or preview routes.
- Do not merge without Steve approval.
- Current proof route: PR 48 / `mockup/madeline-island-destination` with deploy preview `https://deploy-preview-48--startline-mockups.netlify.app/private/mockups/1df440859d5fc4a775302c32796ae129/`.
- Follow-up PRs should be small and reviewable. Prefer stacked PRs targeting `mockup/madeline-island-destination` while PR 48 remains open, then rebase/retarget as needed after PR 48 lands.

## Destination success criteria

Destination should use place to sell the race and make travel/logistics complexity feel like part of the adventure.

Recommended page journey:

1. Emotional hook: cinematic place/race promise.
2. Trust facts: date, location, distance, start/finish, registration path, certification/policies when source-backed.
3. Logistics: getting there, lodging, packet pickup, arrival timing, parking/shuttle/ferry as relevant.
4. Course experience: terrain, landmarks, start/finish, race-day rhythm.
5. Entry decision: distances, pricing, deadlines/caps/status, official registration handoff.
6. FAQ: source-backed objections and travel/race-day answers.

## Audit summary

### What works

- Cinematic dark/sunrise hero creates a premium Destination first impression.
- Race-Weekend Schedule vertical timeline gives the mockup a strong event-weekend rhythm.
- Cream About the Course section has an editorial cadence that fits Destination.

### Core gap

Place is not present enough yet. Race Day gallery uses generic abstract illustrations, and lodging/travel/how-to-get-there is thin. Destination needs a place-specific imagery strategy and a standard Getting There / Where to Stay section.

## PR 1 — Destination critical bugs + customer-facing hygiene

Target: stack from `origin/mockup/madeline-island-destination` into `mockup/madeline-island-destination` while PR 48 is open.

Fixes:

- Sticky header overlaps content at scroll positions.
- Remove Destination countdown; it currently renders `--` and is not needed for this Destination mockup.
- Certification stat breaks stat grid.
- Floating speaker/volume pill overlaps Half Marathon price — investigate/fix if the component exists in Destination scope.
- Boston Qualifying section is misleading unless explicitly configured/source-backed; remove or relabel within Destination.
- Remove visible internal/developer labels in Registration Decision, including `PRIMARY CTA`, `MEASUREMENT`, and `Registration click intent by placement`.
- Standardize Destination CTA color.
- Correct Community green palette bleed inside Destination-only styles.
- Merge/remove duplicate Runner Trust Signals when they duplicate decision/checklist content.

Acceptance checks:

- No sticky nav overlap when navigating to sections.
- No customer-facing internal/dev measurement terms.
- No misleading Boston Qualifying label unless configured/source-backed.
- Stat tiles fit on desktop/tablet/mobile, including long certification text.
- Prices are unobstructed.
- Destination CTA color is consistent.
- Community and Performance are untouched.

## PR 2 — Standard Destination Getting There / Where to Stay section

Add a reusable, schema/config-driven section for Destination travel planning:

- Travel overview.
- Ferry/shuttle/parking/airport guidance as relevant.
- Lodging and camping guidance.
- Recommended arrival timing.
- Packet pickup logistics.
- Start/finish proximity.
- Useful official links.

Madeline proof case:

- Bayfield–La Pointe ferry.
- Lodging/camping/on-island planning.
- Joni’s Beach start/finish.
- Race-weekend planning around packet pickup and ferry/weather dependencies.

Acceptance checks:

- Section hides gracefully when fields are blank.
- Links are source-backed and labeled.
- No customer-specific hardcoding in reusable template code.
- Destination page journey clearly moves from place promise to logistics confidence.

## PR 3 — Destination gallery / place-specific imagery strategy

Replace generic gallery feeling with a reusable place-specific approach:

- Prefer real, safe, source-backed assets when permitted.
- Support location-specific custom/editorial fallback when real assets are unavailable.
- Gallery captions should connect to the actual race place, course, and weekend logistics.

Acceptance checks:

- Gallery no longer feels generic.
- Asset sources/permissions are documented for private mockups.
- Fallback visuals remain Destination-specific rather than abstract stock-like tiles.

## PR 4 — Destination polish / future capability

Future refinements:

- Custom Destination icon set.
- Heading hierarchy polish.
- Dynamic registration status: `open`, `limited`, `waitlist`, `sold_out`, `transfer_only`, `closed`.

Acceptance checks:

- Registration status is config-driven and hides gracefully.
- Visual system remains Destination-specific.
- No cross-template behavior changes without a deliberate shared-schema PR.

## Deferred items

- Full travel/lodging buildout is PR 2, not PR 1.
- Full real/place-specific gallery strategy is PR 3, not PR 1.
- Dynamic registration status and icon-system polish are PR 4, not PR 1.
- Production/customer launch decisions remain blocked on Steve approval.
