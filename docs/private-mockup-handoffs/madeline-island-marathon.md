# Madeline Island Marathon private mockup handoff

Internal-only handoff package for Steve review. Do not add this copy to the runner-facing mockup page, and do not send externally until Steve approves.

## What we improved

- **Destination planning clarity:** The concept turns the island logistics into a clear runner journey: date, La Pointe location, Joni’s Beach start/finish, ferry timing, lodging/camping planning, packet pickup, race-weekend schedule, and Race Roster entry all live in one scan-friendly page.
- **Official registration trust:** Every primary registration CTA keeps Race Roster as the official registration platform, and the page now states the current closed/access-code handoff before a runner clicks out.
- **Travel confidence before registration:** The Destination template now gives runners a dedicated “Getting There / Where to Stay” section before FAQ, reducing hesitation around the Bayfield–La Pointe ferry, weather buffer, arrival timing, and where to stay.
- **Place-specific proof:** The Race Day gallery and travel cards are tied to Madeline Island-specific moments — ferry crossing, Joni’s Beach, shoreline roads, lodging decisions, and post-race gathering — so the page feels like this race, not a generic scenic marathon skin.
- **Measurable registration-status clicks:** The mockup is prepared to track outbound `register_click` intent by CTA placement and platform, while completed registration, payment, access-code entry, transfers, and confirmation remain inside Race Roster unless a separate approved integration is added.

## Mockup URL handoff

Steve review URL: https://mockups.startlinesites.com/private/mockups/1df440859d5fc4a775302c32796ae129/

Notes:

- This is the branded production private URL, not a local preview URL.
- The route is tokenized and emits `noindex,nofollow,noarchive,nosnippet` robots directives.
- Keep this link internal unless Steve explicitly approves including it in an owner/race-director message.
- The latest readiness pass also removes remaining closed-registration copy conflicts such as “Continue to registration” / “Continue to official registration” from the runner-facing Destination page when Race Roster currently shows online registration closed.

## Owner/race-director email draft

Subject: Madeline Island Marathon website note

Hi [Name],

I was reviewing the Madeline Island Marathon & Half Marathon site and noticed how much strong race information is already there: the island setting, Joni’s Beach start/finish, Bayfield–La Pointe ferry logistics, packet pickup windows, course certification, local finisher medal, post-race celebration, and the Race Roster registration path.

I put together a private concept preview to show how the same race information could be organized into a more registration-focused destination race website, with the official Race Roster page still serving as the entry, status, and payment path.

The idea is not to replace Race Roster. Race Roster would remain the official registration platform; the website would make the path from “Can I plan this island weekend?” to “What is the current entry/status path?” easier for runners to follow and easier to measure through outbound registration-click tracking.

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
- Current rendered smoke confirms the page discloses the online-registration-closed/access-code state, shows Race Roster fee-inclusive prices of $130.38 marathon / $103.63 half marathon, and avoids closed-state CTA conflicts such as “Continue to registration,” “Continue to official registration,” “Enter on Race Roster,” and “ready to enter.”
- Current rendered smoke confirms all `#` navigation links have matching section targets and the Travel nav link lands below the fixed nav.
- Browser image QA confirms the gallery now uses five captioned Madeline-specific editorial scenes and no longer exposes weak screenshot/provenance caveats.
- Public Destination preview should remain free of private-only markers and private noindex metadata.
- This handoff package lives under `docs/private-mockup-handoffs/` and is not imported by the Astro private mockup route.
