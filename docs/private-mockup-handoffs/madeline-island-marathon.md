# Madeline Island Marathon private mockup handoff

Internal-only handoff package for Steve review. Do not add this copy to the runner-facing mockup page, and do not send externally until Steve approves.

## What we improved

- **Destination planning clarity:** The concept turns the island logistics into a clear runner journey: date, La Pointe location, Joni’s Beach start/finish, ferry timing, lodging/camping planning, packet pickup, race-weekend schedule, and Race Roster entry all live in one scan-friendly page.
- **Official registration trust:** Every primary registration CTA keeps Race Roster as the official registration platform, so the preview clarifies the path from race information to the existing official entry page instead of replacing it.
- **Travel confidence before registration:** The Destination template now gives runners a dedicated “Getting There / Where to Stay” section before FAQ, reducing hesitation around the Bayfield–La Pointe ferry, weather buffer, arrival timing, and where to stay.
- **Place-specific proof:** The Race Day gallery and travel cards are tied to Madeline Island-specific moments — ferry crossing, Joni’s Beach, shoreline roads, lodging decisions, and post-race gathering — so the page feels like this race, not a generic scenic marathon skin.
- **Measurable registration clicks:** The mockup is prepared to track outbound `register_click` intent by CTA placement and platform, while completed registration, payment, transfers, and confirmation remain inside Race Roster unless a separate approved integration is added.

## Mockup URL handoff

Steve review URL: https://mockups.startlinesites.com/private/mockups/1df440859d5fc4a775302c32796ae129/

Notes:

- This is the branded production private URL, not a local preview URL.
- The route is tokenized and emits `noindex,nofollow,noarchive,nosnippet` robots directives.
- Keep this link internal unless Steve explicitly approves including it in an owner/race-director message.
- This handoff PR also removes remaining source/provenance-style gallery and story wording from the runner-facing Destination page so the mockup reads more like a polished race site preview.

## Owner/race-director email draft

Subject: Madeline Island Marathon website note

Hi [Name],

I was reviewing the Madeline Island Marathon & Half Marathon site and noticed how much strong race information is already there: the island setting, Joni’s Beach start/finish, Bayfield–La Pointe ferry logistics, packet pickup windows, course certification, local finisher medal, post-race celebration, and the Race Roster registration path.

I put together a private concept preview to show how the same race information could be organized into a more registration-focused destination race website, with the official Race Roster page still serving as the entry and payment path.

The idea is not to replace Race Roster. Race Roster would remain the official registration platform; the website would make the path from “Can I plan this island weekend?” to “I’m ready to enter” easier for runners to follow and easier to measure through outbound registration-click tracking.

If useful, I can send over the private concept preview for review. No pressure either way — I thought Madeline Island had enough distinctive destination appeal and runner logistics detail that it was worth showing as an example.

Best,
Steve

## Steve approval options

- **Approve audit only:** Send a short respectful audit note without offering or linking the mockup.
- **Approve audit + offer mockup:** Send the email draft, but ask whether they would like to see the private concept preview before sharing the URL.
- **Approve audit + include private preview link:** Send the email draft with the tokenized private URL included.
- **Hold for edits:** Revise tone, recipient, subject line, proof points, or preview content before anything is sent.

## Evidence and verification pointers

- Branded production private URL smoke: HTTP 200 at `https://mockups.startlinesites.com/private/mockups/1df440859d5fc4a775302c32796ae129/`.
- Private route has `noindex,nofollow,noarchive,nosnippet` robots directives.
- Current rendered smoke confirms source-backed facts present: Saturday, May 16, 2026; La Pointe, Wisconsin; Joni’s Beach; Marathon and Half Marathon; Race Roster; Bayfield–La Pointe ferry; packet pickup; USATF certified courses; 7-hour time limit; lodging/camping planning; post-race party and awards.
- Current rendered smoke confirms all `#` navigation links have matching section targets and the Travel nav link lands below the fixed nav.
- This handoff PR adds a rendered guard against visible `public race information` phrasing and rewrites the Madeline story/gallery copy to runner-facing language.
- Browser image QA should confirm all rendered images decode after this PR deploys and after scrolling the production private page.
- Public Destination preview should remain free of private-only markers and private noindex metadata.
- This handoff package lives under `docs/private-mockup-handoffs/` and is not imported by the Astro private mockup route.
