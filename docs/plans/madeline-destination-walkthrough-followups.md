# Madeline Island Destination walkthrough follow-up PR sequence

Internal planning note from the naive race-director walkthrough of the Madeline Island Marathon & Half Marathon Destination private mockup. Keep each PR narrow and merge only with Steve approval.

## PR 1 — Visible source/meta wording cleanup

**Goal:** Make the private mockup read like a polished runner-facing race page, not a research/audit draft.

**Scope:**

- Rewrite visible Madeline copy that says “The About page says,” “The public FAQ says,” or “Review the public race facts.”
- Remove gallery micro-labels that feel like a design board (“Race visual,” “Place study”) from customer-facing rendering.
- Add rendered-private validation guards so these buyer-facing leaks do not recur.

**Why it drives registration:** Source/meta wording weakens trust before a runner clicks to Race Roster. Direct race-site language makes the page feel official and ready.

**Verification:** `npm run validate:private-mockups`, `npm run build`, `npm run validate:rendered-private-mockups`, plus browser visible-text smoke on the Madeline private route.

## PR 2 — Race Roster handoff truth and pricing alignment

**Goal:** Reconcile the mockup’s registration state and price framing with the official Race Roster page.

**Scope:**

- Represent the current official handoff state honestly when Race Roster shows online registration closed or access-code-only.
- Clarify base price vs. provider fee-inclusive price, or update display copy to avoid surprise at checkout.
- Keep CTAs safe: “Check Race Roster status,” “View official entry page,” or similar if registration is closed.

**Why it drives registration:** The registration handoff is the highest-trust moment. A mismatch between the mockup and Race Roster can cause abandonment or make the race look disorganized.

**Verification:** Click/smoke the Race Roster destination, compare visible status/fees against the mockup, and run the private mockup gates.

## PR 3 — Race Day visual proof pass

**Goal:** Make the gallery emotionally sell the island weekend instead of feeling partly placeholder-like.

**Scope:**

- Audit the current image assets visually after lazy loading.
- Replace weak/washed-out images where rights-safe better assets exist, or improve the fallback visual presentation.
- Ensure captions sell runner experience, not asset/provenance mechanics.

**Why it drives registration:** Destination races sell emotion and place. Stronger visuals make the mockup more convincing to both race directors and runners.

**Verification:** Browser image decode checks, mobile/desktop screenshot review, no horizontal overflow, and private rendered hygiene scan.

## PR 4 — Mobile scanability polish, only if still needed after PRs 1–3

**Goal:** Reduce density in later mobile sections if the final walkthrough still feels heavy.

**Scope:**

- Tighten travel-card and FAQ mobile rhythm.
- Improve scan hierarchy for long logistics cards.
- Avoid changing desktop visual direction unless required by reusable CSS.

**Why it drives registration:** If runners are planning travel on mobile, dense sections can slow the commitment path even when technically readable.

**Verification:** 375/390/414 mobile visual review, travel/FAQ anchor checks, and no-overflow probes.

## Final pass

After the focused PRs merge, rerun a naive race-director walkthrough against the production private URL and update the handoff package if the owner-facing framing changes.
