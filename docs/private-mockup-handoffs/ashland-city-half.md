# Ashland City Half-Marathon private mockup handoff

Internal-only handoff package for Steve review. Do not add this copy to the runner-facing mockup page, and do not send externally until Steve approves.

## What we improved

- **Runner clarity:** The concept brings the half marathon date, start time, location, distance, price tiers, packet pickup, refund/transfer policy, aid stations, awards, and course cutoff into a single runner-first page instead of making runners piece together details before registering.
- **Official registration trust:** Every primary registration CTA keeps RunSignup as the official registration platform, so the preview clarifies the path from race information to the existing checkout instead of replacing it.
- **Performance credibility:** The page leads with the fast, flat, USATF-certified course, certification number, aid-station miles, time limit, and Tennessee single-age record eligibility so the Performance template feels precise and race-specific rather than generic.
- **Race-day photo proof:** The page now surfaces the existing 2023 Pixieset race-photo gallery as a secondary trust signal, letting runners see prior race-day energy without StartLine hosting or claiming rights to the photographer’s archive.
- **Measurable registration clicks:** The mockup is prepared to track outbound `register_click` intent by CTA placement and platform, while completed registration, payment, confirmation, transfers, and refunds remain inside RunSignup unless a separate approved integration is added.

## Mockup URL handoff

Steve review URL: https://mockups.startlinesites.com/private/mockups/e6e18fe20474d344e2b82718edbfb2c7/

Notes:

- This is the branded production private URL, not a local preview URL.
- The route is tokenized and emits `noindex,nofollow,noarchive,nosnippet` robots directives.
- Keep this link internal unless Steve explicitly approves including it in an owner/race-director message.
- This handoff PR adds a runner-facing Past Race Photos section that links out to the existing 2023 Pixieset gallery; the mockup does not download, rehost, or imply ownership of photographer images.

## Owner/race-director email draft

Subject: Ashland City Half-Marathon website note

Hi [Name],

I was reviewing the Ashland City Half-Marathon site and noticed how much useful runner information is already there: the fast, flat USATF-certified course, Riverbluff Park start/finish, aid-station locations, packet pickup details, awards, price tiers, previous race photos, and the RunSignup registration path.

I put together a private concept preview to show how the same race information could be organized into a more registration-focused race website, with the official RunSignup link still serving as the checkout path.

The idea is not to replace RunSignup. RunSignup would remain the official registration platform; the website would make the path from race details to registration easier for runners to follow and easier to measure through outbound registration-click tracking.

If useful, I can send over the private concept preview for review. No pressure either way — I thought Ashland City had enough strong course proof and runner detail that it was worth showing as an example.

Best,
Steve

## Steve approval options

- **Approve audit only:** Send a short respectful audit note without offering or linking the mockup.
- **Approve audit + offer mockup:** Send the email draft, but ask whether they would like to see the private concept preview before sharing the URL.
- **Approve audit + include private preview link:** Send the email draft with the tokenized private URL included.
- **Hold for edits:** Revise tone, recipient, subject line, proof points, or preview content before anything is sent.

## Evidence and verification pointers

- Branded production private URL smoke: HTTP 200 at `https://mockups.startlinesites.com/private/mockups/e6e18fe20474d344e2b82718edbfb2c7/`.
- Private route has `noindex,nofollow,noarchive,nosnippet` robots directives.
- Current rendered smoke confirms registration CTAs point to `https://runsignup.com/Race/TN/AshlandCity/AshlandCityHalfMarathon` with placement-level analytics attributes.
- Current rendered smoke confirms source-backed facts present: Saturday, March 7, 2026; Ashland City, TN; Riverbluff Park; 13.1 mi; USATF certification `#TN22002MS`; 5 aid stations; 3-hour course limit; $60 / $70 / $80 price tiers; packet pickup; awards/prize money.
- Current rendered smoke should confirm the Past Race Photos section links to the source-listed 2023 Pixieset gallery at `https://nickmorganphotography16.pixieset.com/ashlandcityhalfmarathon/` without embedding or rehosting photographer images.
- Current rendered smoke confirms blocked internal/provenance terms are absent from visible page text.
- Browser image QA should confirm all rendered images decode after this PR deploys; the Race Day media now uses the hero runners image and course map instead of the 144px event graphic.
- Public Performance preview should remain free of private-only markers and private noindex metadata.
- This handoff package lives under `docs/private-mockup-handoffs/` and is not imported by the Astro private mockup route.
