# Humboldt Bay Marathon private mockup handoff

Internal-only handoff package for Steve review. Do not add this copy to the runner-facing mockup page, and do not send externally until Steve approves.

## What we improved

- **Runner clarity:** The concept groups the Marathon, Half Marathon, and 5K into one scan-friendly structure with date, location, start times, course profiles, aid support, packet pickup, parking, medals/shirts, timing, and FAQs close to the registration decision.
- **Official registration trust:** Every primary registration CTA keeps Runzy as the official registration platform, so the preview clarifies the path from race information to the existing official registration handoff instead of replacing it.
- **Mobile-first decision path:** Key race facts, distance details, and logistics are organized for quick mobile scanning so runners do not need to piece together details across multiple pages before clicking registration.
- **Measurable registration clicks:** The mockup is prepared to track outbound `register_click` intent by CTA placement and platform, while completed registration, payment, and confirmation remain inside Runzy unless a separate approved integration is added.
- **Community proof:** The page surfaces source-backed local signals such as Sara Starr’s artwork, Ghirardelli Associates as Title Sponsor, Redwood Coast Mountain Bike Association timing support, volunteer opportunities, and waterfront/trail identity.

## Mockup URL handoff

Steve review URL: https://mockups.startlinesites.com/private/mockups/44c6e4f218aa7860b1f453bc03aa452f/

Notes:

- This is the verified branded production private URL, not a local preview URL.
- The route is tokenized and emits `noindex,nofollow,noarchive,nosnippet` robots directives.
- Keep this link internal unless Steve explicitly approves including it in an owner/race-director message.

## Owner/race-director email draft

Subject: Humboldt Bay Marathon website note

Hi Terri,

I was reviewing the Humboldt Bay Marathon site and noticed how much strong race information is already there: the waterfront courses, certified distances, local artwork, sponsor support, volunteer information, and the Runzy registration path.

I put together a private concept preview to show how the same public race information could be organized into a more registration-focused race website, with a clearer runner-first structure on mobile and a direct handoff to the official Runzy registration page.

The idea is not to replace Runzy. Runzy would remain the official registration platform; the website would simply make the path from interest to registration easier for runners to follow and easier to measure through outbound registration-click tracking.

If useful, I can send over the private concept preview for review. No pressure either way — I thought Humboldt Bay had enough community proof and race detail that it was worth showing as an example.

Best,
Steve

## Steve approval options

- **Approve audit only:** Send a short respectful audit note without offering or linking the mockup.
- **Approve audit + offer mockup:** Send the email draft, but ask whether they would like to see the private concept preview before sharing the URL.
- **Approve audit + include private preview link:** Send the email draft with the tokenized private URL included.
- **Hold for edits:** Revise tone, recipient, subject line, or proof points before anything is sent.

## Evidence and verification pointers

- Branded production private URL smoke: HTTP 200 at `https://mockups.startlinesites.com/private/mockups/44c6e4f218aa7860b1f453bc03aa452f/`.
- Private route has `noindex,nofollow,noarchive,nosnippet` robots directives.
- Current rendered smoke confirmed source-backed facts present: Humboldt Bay Marathon, Sara Starr, Ghirardelli Associates / Title Sponsor, Timing Support / Redwood Coast Mountain Bike Association.
- Current rendered smoke confirmed blocked internal/provenance terms absent from the production private page.
- Browser image QA confirmed all 7 rendered images decode after scrolling the production private page.
- Public Community preview was verified separately as HTTP 200 with no private markers.
- This handoff package lives under `docs/private-mockup-handoffs/` and is not imported by the Astro private mockup route.
