# Moving Assistant Planning Notes

**Read this first, skip the rest unless your task needs it:** Moving Assistant is an NYC-only, local-first PWA move command center (no accounts, no server, no other markets — see `Non-Goals`). Current priority is depth over breadth: finish wiring the Move Profile fields that already exist before adding new ones (see `Roadmap` Phase 1 and `Next / Planned Work`). Default to action on ambiguity; only ask when it's genuinely risky (see `Operating Principles`). Full roadmap is in `Roadmap`.

This is the living planning file for the project. It should help Codex act as a high-quality engineer/PM partner, not just store a list of ideas.




## Handoff Snapshot (2026-07-09 End Of Chat)

## Handoff Snapshot (2026-07-09, planning session)

Use this section as the next session's starting point. Last committed checkpoint is `886a9f3 Turn dashboard into a guided coach, simplify nav, rank apartment sources` on `main`. Working tree is clean except `.DS_Store` / `src/.DS_Store` (leave alone).

Apartment search status: still early/browsing, not yet touring. This means borough-depth work (item 2 below) has limited payoff right now since the target area (Gramercy/Flatiron/Murray Hill) is already fixed to Manhattan — revisit its priority once touring/applications start or if other boroughs enter consideration.

**Decision this session: local reminders (old item 3, Notifications API) are backlogged, not next.** The app is currently used as a browser tab, not installed to the home screen. iOS Safari (and most browsers to varying degrees) requires a PWA to be installed before the Notifications API works at all — building this now would likely ship a feature that silently never fires. Revisit once the app is actually installed as a PWA, or if that changes.

**Two concrete bugs were found this session and need fixing first, before new feature work. Full instructions below.**

### Bug 1: Box Inventory "Removed ... Undo" banner never goes away on its own

`state.recentlyRemovedBox` is set when a box is deleted (`boxes.js`, the `[data-box-remove]` click handler) so an inline "Removed [box]. Undo" banner can show. The bug: it is persisted like real data and rehydrated on every load, so it survives page refresh, reopening the tab, and importing an old backup — it can sit there indefinitely until the user happens to click Undo or delete a different box.

**Fix instructions:**

1. In `src/js/state.js`, leave `sanitizeState()`'s existing handling of `recentlyRemovedBox` alone — do not remove or null it there. (Reason: `saveState()` calls `sanitizeState()` on every save, so nulling it in the sanitizer would break the banner even within the same session, before it ever renders.)
2. In `src/js/state.js`, inside `loadState()`, right after `const migrated = window.MovingApp.sanitizeState(JSON.parse(saved));`, add a line that sets `migrated.recentlyRemovedBox = null;` before the function returns `migrated`. This clears it specifically on a fresh app boot from storage, without touching the same-session save/render round trip.
3. In `src/js/app.js`, find the backup-import handler (search for `state = AppEngine.sanitizeState(parsed);`). Immediately after that line, add `state.recentlyRemovedBox = null;` before `AppEngine.saveState(state);`. Reason: importing an old backup shouldn't replay whatever "just removed" banner existed at the moment that backup was taken.
4. In `src/js/boxes.js`, add an explicit dismiss control next to the existing "Undo" button in the banner markup (the block starting `${state.recentlyRemovedBox ? ...}` inside `renderBoxes()`). Wrap "Undo" and a new "×" dismiss button together in a small `<span class="mt-box-undo-banner-actions">` wrapper. Give the dismiss button `id="mt-box-dismiss-remove"`.
5. Also in `src/js/boxes.js`, add an 8-second auto-dismiss timer: at the top of the module (inside the `window.MovingBoxes = (function() { ... })()` IIFE, before any function declarations), add a module-level `let undoBannerTimeout = null;` and a small helper `clearUndoBannerTimeout()` that clears and nulls it if set. In the `[data-box-remove]` click handler, after `render()` is called, call `clearUndoBannerTimeout()` then schedule a new `setTimeout` (8000ms) that — only if `state.recentlyRemovedBox` still matches the id that was just removed — nulls it, saves, and re-renders. In both the "Undo" click handler and the new dismiss button's click handler, call `clearUndoBannerTimeout()` before doing anything else, so a stale timer can't fire after the user has already acted.
6. In `src/css/style.css`, add matching styles: a `.mt-box-undo-banner-actions` flex wrapper (small gap, align-items center) and a `.mt-mini-action-dismiss` style — reuse the existing `.mt-mini-action` look but muted/borderless (transparent background/border, muted text color, small padding, `font-size: 15px` for the × character), with a subtle hover background.
7. Bump `CACHE_VERSION` in `sw.js` by one, since `state.js`, `app.js`, `boxes.js`, and `style.css` all changed.
8. Update `test/smoke.test.js`: the existing test `box inventory deletion uses inline undo instead of modal copy` currently seeds `recentlyRemovedBox` through the full saved-state boot path (`renderAppWithState`) and expects the banner to render — that will now correctly fail, since fix step 2 clears it on boot. Split it into two tests:
   - One that renders `MovingBoxes.renderBoxes(ctx)` **directly** (bypassing the full app boot / `loadState`), passing a minimal `ctx` with `{ AppEngine, esc, state: { boxes: [], recentlyRemovedBox: {...} } }`, and asserts the banner markup (`Removed Box 1`, `mt-box-undo-remove`, `mt-box-dismiss-remove`) is present. This tests the render function in isolation, independent of persistence.
   - A new test that seeds `recentlyRemovedBox` into saved state, boots the full app via `renderAppWithState`, and asserts the banner does **not** appear in the rendered HTML — proving the fix.
9. Log the fix in `CHANGELOG-UPDATES.txt` under a new dated entry once implemented and verified.
10. Verify with `npm test` and `npm run check:js` before considering this done.

### Bug 2: Mobile nav menu doesn't actually match desktop's four-group model

See `Code Audit Findings (2026-07-09)` below and `Next / Planned Work` item 8 for full detail and fix instructions.

**Priority order for this session: fix Bug 1, then Bug 2 (item 8), then item 1 (snooze/not-relevant), then item 2 (borough depth) if time remains.**

Update (2026-07-11): Bug 1 and Bug 2 were committed in `85d76e2`. Snooze/not-relevant controls are now implemented locally with stable focus IDs, persisted dismissal state, one-day snooze, permanent not-relevant handling, and same-session Undo. Verification passes 24/24 tests plus `npm run check:js`. Next product item is borough-level NYC depth, but only once it provides useful advice for the current apartment-search stage.

Update (2026-07-11, continued): borough-level NYC depth is now implemented locally. Move Profile stores the destination borough; Timeline shows official-source curb, loading-zone, and truck-route checks with a bounded Manhattan special-zone warning; and the mover shortlist discloses its Manhattan/close-borough bias outside Manhattan. Citywide rules remain citywide rather than being presented as invented borough differences. Verification passes 25/25 tests plus `npm run check:js`.

1. **Snooze / not-relevant controls for focus items** (`Next / Planned Work` item 4, sub-bullet). Concrete plan:
   - `getTodaysFocusItems()` in `app.js` (~line 585) currently rebuilds a fresh, unkeyed list every render (dedupe key today is `text + '|' + tab`, which changes whenever counts in the text change — not stable enough to persist a dismissal against).
   - Give each focus item a **stable `id`** independent of its display text, e.g. `'move-week-essentials'`, `'timeline-phase'`, `'apartment-hunt'`, `'apartment-tracker'`, `'box'`, `'utility'`, `'room'`, `'backup'`. These map 1:1 to the existing `items.push(...)` call sites in `getTodaysFocusItems()`.
   - Add `state.dismissedFocusItems` (object keyed by that stable `id`, value `{ mode: 'snoozed' | 'not-relevant', until: <ISO date or null> }`). Add defaults + sanitization in `state.js` alongside the existing `moveProfile` sanitization pattern.
   - Filter dismissed items out of `getTodaysFocusItems()`'s return before the `.slice(0, 3)`, respecting `until` for snoozed items (auto-reappear once passed) and permanently hiding `not-relevant` ones.
   - UI: small dismiss affordance on each Dashboard focus card — reuse the inline "Removed ... Undo" banner pattern from Bug 1 above rather than a new modal pattern.
   - Needs test coverage: a snoozed item disappears until its date, a not-relevant item never reappears, dismissing one item doesn't affect others' stable ids.

2. **Borough-level NYC depth** (`Next / Planned Work` item 2). Lower urgency than item 1 given "still browsing" status above, but next in line. Concrete plan:
   - Add `moveProfile.borough` (`'manhattan' | 'brooklyn' | 'queens' | 'bronx' | 'staten-island'`) following the exact pattern of `apartmentHunt`/`moveStyle` in `state.js` (~line 538 defaults, ~line 612 sanitization).
   - Only ship if it visibly changes advice on day one — strongest candidates per `NYC Depth Strategy`: alternate-side-parking/truck-loading rules and building-type mix (walk-up vs elevator prevalence).
   - Label the built-in `MOVERS` list (`state.js`) as Manhattan/close-borough-biased if borough is added, so non-Manhattan users aren't misled.
   - Source any borough-specific legal/permit claims from NYC.gov/DOB/DSNY before shipping copy — do not generalize from memory.

Good next steps for the next chat:
- Re-run `git status --short`, `npm test`, and `npm run check:js` to confirm nothing drifted since this snapshot.
- Fix Bug 1 and Bug 2 first — both are small, self-contained, and high-confidence.
- Keep changes small and verified per increment, per `Operating Principles`.

## How To Use This File

At the start of future work:

- Read `Current Focus`, `Decision Rules`, and the relevant backlog section.
- If the user's request conflicts with this file, follow the user but update this file after the decision.
- If the request is ambiguous, ask concise clarifying questions before creating churn.
- If the request is clear and low-risk, act directly and verify.
- Keep changes small enough to finish, test, and summarize before the next checkpoint.
- Do not add UI inputs before the reason is planned end-to-end: what the user enters, how the app uses it, what advice/UI changes, and why it saves time or stress.

At the end of each meaningful increment:

- Remove finished items from `Next / Planned Work` and log them in `CHANGELOG-UPDATES.txt`, not in this file.
- Add new ideas we discuss before they disappear into chat history.
- Prune ideas that no longer fit the product.
- Prefer small, shippable increments with tests.
- Keep the app focused on making moving feel calmer, clearer, and less expensive.
- Codex has limited working context/tokens: choose efficient next steps, avoid biting off too much at once, and check in after each meaningful verified increment.
- Ask concise clarifying questions when something important is unclear, and think critically about user requests: suggest stronger product/engineering ideas when they would better serve the app.

## Code Audit Findings (2026-07-08)

Read against the actual source (`state.js`, `app.js`, `apartments.js`, `movers.js`, `boxes.js`, `sw.js`, `test/smoke.test.js`). These are concrete, file-grounded findings, not speculation — captured here so they don't get re-discovered from scratch next session.

- **Resolved 2026-07-09:** the `nyc`/`other` market split, free-text City/market wizard question, `state.city`, and `moveProfile.market` were removed to match the NYC-only decision. Future NYC depth should use `borough` only once it visibly changes guidance.
- **Resolved 2026-07-09:** the leftover "non-NYC users" FARE Act note in `apartments.js` was removed.
- **Resolved 2026-07-09:** orphaned `moveProfile.housing` (`'renter' | 'owner'`) was removed from defaults and sanitization.
- **Resolved 2026-07-09:** orphaned `moveProfile.distance` (`'local' | 'long-distance'`) was removed rather than adding a speculative long-distance setup question.
- **Resolved 2026-07-09:** `moveProfile.buildingType` now changes Move Timeline, task alerts, and Move Day guidance for apartment/building versus house/standalone moves.
- **The built-in mover list needs no changes for the NYC-only decision.** All 7 movers in `MOVERS` (`state.js`) are already NYC-specific by name, COI details, and borough framing (Roadway, FlatRate, Dumbo, Zip to Zip, Oz, JP Urban, Metropolis). There's no generic-market mover content to strip — this part of the codebase was never actually multi-market, only the profile field pretended to be.
- **One real outbound network call exists**, worth naming explicitly in `Data & Privacy Principles` rather than leaving it implied away: `fetchListingPreview()` in `apartments.js` sends a pasted apartment-listing URL to `https://api.microlink.io` to fetch a preview image (with a blocklist for StreetEasy/Zillow/Apartments.com, which don't support it anyway). This is a reasonable, narrow exception — a URL, not personal data — but the doc should say so rather than imply zero network calls.
- **Inline styles are a real, sizeable debt, not a someday item:** 103 `style="..."` attributes total (48 in `app.js`, 34 in `apartments.js`, 13 in `movers.js`, 8 in `boxes.js`). Worth tackling opportunistically as those files are touched, per the existing UX backlog item, but don't let it become a dedicated large refactor — that would violate the "behavior-preserving refactors before risky feature work" rule for low reward.
- **Test coverage is genuinely solid where it exists** (compile checks, script order, cache completeness, tab/state sync, migration, backup summaries — 8 passing tests) **but has zero coverage of applicability/hide-show behavior**, confirming the plan's existing item 9 precisely.
- **Escaping discipline looks solid on spot-check** — box labels/contents and apartment notes are consistently passed through `esc()` before interpolation. No action needed; noted here so it doesn't get re-audited from scratch.
- Default neighborhoods (`Gramercy`, `Flatiron`, `Murray Hill`) are your own search area. Fine as a personal default; worth a deliberate decision later on whether that stays personal or becomes a generic new-user seed once/if this is ever shared beyond one person.

## Code Audit Findings (2026-07-09)

Full read of the `886a9f3` diff (`app.js`, `dashboard.js`, `apartments.js`, `boxes.js`) plus a scan for similar patterns elsewhere. Two real findings.

- **Bug 1 (Box Inventory undo banner persistence)** — see `Handoff Snapshot` for full fix instructions.

- **Bug 2: mobile nav menu does not actually mirror the desktop four-group model, despite the `886a9f3` commit message claiming it does.** `appSections` (`app.js` ~line 13) now carries two parallel classification fields per item: the old `category` (`'general' | 'apartment' | 'moveout'`) and the new `navGroup` (`'Start Here' | 'Work' | 'Apartment' | 'Reference'`). `renderSidebar()` (desktop) uses `navGroup` exclusively. `openMobileMenu()` uses a mix: `category` for the top "general row" and the "Finding an Apartment" column, `navGroup` only for the Work/Reference columns.
  - Concrete effect: `savings` (labeled "Costs") has `category: 'general'` but `navGroup: 'Reference'`. On desktop it's grouped with Move Day/Supplies/Movers at the bottom of "Reference." On mobile it renders in the top `.mt-general-row` — a visually separate, more prominent block above all four grouped columns — right next to "Today." Same nav item, meaningfully different prominence depending on platform.
  - Mobile column headings also don't match desktop's new group names ("🔑 Finding an Apartment" vs desktop's "Apartment"), another small leftover from before the rename.
  - Risk going forward: any new section needs `category` and `navGroup` set consistently across two mental models, or it'll render correctly on one platform and wrong (or missing) on the other.
  - The existing test (`navigation tabs and state-valid tabs stay in sync`, `test/smoke.test.js`) only regex-matches that the literal strings `navGroup: 'Start Here'` and `navGroup: 'Reference'` appear somewhere in `app.js`. It never renders `openMobileMenu()` or checks that mobile grouping actually matches desktop — it would pass today despite this bug.
  - **Fix instructions:** Retire `category` as a grouping field entirely; use `navGroup` as the single source of truth for both desktop and mobile. In `openMobileMenu()`, replace the `generalSecs`/`aptSecs` filters (which use `category`) with `navGroup`-based filters matching desktop's four groups exactly, including matching group titles/headings word-for-word. Decide deliberately whether "Today" (and possibly "Costs") should keep a visually separate, more prominent top row — if so, gate that specifically by `id === 'dashboard'`, not by a semi-redundant `category` field, and apply the same visual treatment on desktop if it's meant to be consistent. Add a real test: call the mobile-menu render path directly (similar to how `MovingBoxes.renderBoxes()` can be called directly for isolated testing) and assert that every item's rendered group matches its `navGroup` value, for both desktop and mobile.

- **Minor, not a bug, worth a deliberate decision:** `state.editingBoxId` (Box Inventory) persists across reload — if you're mid-edit on a box and refresh, it reopens that box's edit form. Unlike `recentlyRemovedBox`, this doesn't grow stale or misleading over time (it just points at a still-real box), so it's a legitimate UX choice either way. Flagging so it's an intentional choice, not an accidental side effect of the same pattern that caused Bug 1.

## Roadmap

The big picture, sequenced. Each phase points at the detailed sections rather than repeating them — this is the map, not the territory. Work roughly in order; later phases assume earlier ones are done, but nothing here is locked if reality suggests reordering.

**Phase 0 — Cleanup (done).**
Dead `market`/`city`/`housing` fields and the leftover non-NYC FARE Act note are removed; the codebase now matches the NYC-only decision.

**Phase 1 — Finish the applicability foundation.**
Build the applicability engine only if another profile field starts gating visibility (item 7). The existing Move Profile fields now all either alter behavior or were removed, and hide/show behavior has render-level smoke coverage.

**Phase 2 — NYC depth.**
Add `borough` once it visibly changes advice (item 2, `NYC Depth Strategy`). Add building-type guidance (item 4: COI/elevator for apartments, driveway/utilities for houses). This is where the app gets meaningfully smarter within its chosen scope instead of wider.

**Phase 3 — The dated-item primitive and its four consumers.**
Build the shared due-date/cost primitive (item 6) once at least two consumers are real. Then deadline chips, local reminders, budget-vs-actual, printable move packet, and `.ics` export all draw from one list instead of five separate builds — see the `Product Ideas` combination note. Local reminders are the single highest-leverage item in this phase.

**Phase 4 — Household collaboration, smallest slice first.**
Start with a shared document/photo checklist (`Product Ideas`, "Lightweight shared move"), not a shared inventory or budget. Evaluate anything beyond that against `Non-Goals` and log the decision explicitly rather than drifting into a server backend.

**Phase 5 — Close the loop past Move Day.**
First-week-in-new-place mode now has an initial Move Day section for utilities, deposit follow-up, address updates, and new-place basics. Future work can turn it into a fuller post-move mode if needed (`Product Ideas`).

**Phase 6 — Sleek & fun polish.**
Once the functional core is solid: visual identity pass, the move recap/"wrapped" screen, Move Day's distinct mode (decide quieter vs more-focused), small earned motion (`Sleek & Fun — Identity Ideas`). Deliberately last — polish compounds better on a finished feature set than a moving target.

**Phase 7 — Documentation split (future, only if this file keeps growing).**
Not needed yet at ~400 lines, but the plan if it grows past ~600: split `NYC Depth Strategy` into `NYC-STRATEGY.md`, `Sleek & Fun` and `Visual / Asset Wishlist` into `DESIGN-NOTES.md`, leaving a one-line pointer here for each — same pattern already used for `Completed`. Do this only when it actually saves more context than it costs in indirection; a sub-400-line single file is still cheaper to read than three files with cross-references.

## Current Focus

Default next direction unless the user says otherwise:

1. Audit the current Move Profile inputs and make each one earn its place.
2. Implement useful applicability behavior before adding any more setup fields.
3. Go deep on NYC, not wide across markets: use `borough` as the near-term profile split where it visibly changes advice. Regional/national support is explicitly out of scope for now — see `Non-Goals`.
4. Continue module extraction only when it makes the next product work safer.
5. Improve Dashboard/mobile UX in small verified passes.

Current product thesis: make the app feel adaptive without adding form tax. The app should not show every moving workflow to every user, but it also should not ask for context that it does not immediately use.

Every visible field must earn its place with an end-to-end answer:

- What does the user enter?
- What changes in the app immediately?
- What irrelevant UI or advice disappears?
- What better guidance appears?
- Why does this save time, money, or stress?

If those answers are weak, remove the field, hide it until the behavior exists, or keep the idea in planning instead of shipping it in the UI.

## Operating Principles

How Codex should actually behave while working this plan, not just what to build:

- Default to the most reasonable interpretation of a request and proceed, stating the assumption in the checkpoint, rather than stopping to ask. Ambiguity is a reason to pick a sensible default, not a reason to stall.
- Only ask a clarifying question when proceeding would clearly waste effort, risk user data, or go in a direction that conflicts with an explicit decision already recorded in this file. One question, asked once, beats a round trip "just to be safe."
- Scale effort to the size of the ask. A copy tweak is a two-minute edit and a one-line checkpoint. A new tab or a state-shape change gets a real plan first: what changes, what it risks, how it's verified.
- Finish what you start. A half-wired field (added to setup but not yet read anywhere) is worse than not adding it, because it silently breaks the "every field earns its place" rule. Land features end-to-end or don't land them.
- Prefer the boring, correct answer over the clever one. This app holds someone's move-critical information; predictability beats novelty in the data layer.
- Treat this file as memory, not decoration. If a decision was made in chat and isn't reflected here, the next session doesn't know it happened.

## Decision Rules

Use these to choose between possible next steps:

- Prefer work that makes the app more useful during real moving stress.
- Prefer changes that improve clarity, trust, data safety, or mobile ergonomics.
- Prefer behavior-preserving refactors before risky feature work in crowded files.
- Prefer adapting existing surfaces over adding new tabs.
- Do not add state fields without defaults, sanitization, and tests.
- Do not add form fields that merely collect context. Every input should immediately change useful behavior, personalize advice, reduce irrelevant UI, or power a clear upcoming workflow.
- Do not add a visual flourish unless it improves orientation, confidence, or delight without adding clutter.
- If a feature adds tracking burden, it must clearly save time, money, or stress later.
- If a proposed field depends on external facts, such as city-specific laws or moving rules, plan the source strategy and update cadence before putting it in the UI.

## Clarifying Question Rules

These sharpen `Operating Principles` for the specific case of an ambiguous request; default is still to act.

Ask questions when:

- The answer changes data shape, navigation, or user-facing workflow.
- The work could conflict with the user's actual moving situation.
- There are multiple reasonable product directions with different tradeoffs.
- A design choice needs taste/context the repo cannot reveal.

Do not ask questions when:

- The next step is low-risk, reversible, and already implied by the plan.
- Existing code patterns clearly answer the implementation choice.
- A sensible default preserves current behavior.

When asking, keep it short:

- Ask 1-3 questions max.
- State why the answer matters.
- Offer a recommendation when one option is clearly better.

## Checkpoint Template

When reporting back, include:

- What changed, with file links.
- What was verified.
- Any known limitations or skipped checks.
- The best next bite, unless the user already gave the next direction.

## Definition of Done

An increment is not finished until it clears all of these. If it can't clear them, it isn't ready to report as complete:

- Tests pass (`npm test`) and syntax checks pass (`npm run check:js`).
- No new console errors or warnings in a manual click-through of the touched tabs.
- Service-worker `CACHE_VERSION` in `sw.js` is bumped if any shell/script/asset file changed.
- New or changed state fields have defaults, sanitization on load, and a migration path for existing saved data.
- The feature works end-to-end, not just in the happy path: reload the page, re-open the tab, confirm the data survived.
- Mobile layout checked at a narrow viewport, not just desktop.
- `PROJECT-PLANNING.md` reflects the change: item removed from `Next / Planned Work`, logged in `CHANGELOG-UPDATES.txt`, and `Decision Log` updated if a real product/architecture choice was made.

## Non-Goals

Explicit scope guardrails, not just things nobody has gotten to yet. Revisit these deliberately rather than drifting into them:

- No regional or national market support for now. This is an NYC app until deliberately decided otherwise — no `generic-us` fallback market, no other-city packs, no market picker in setup. Depth within NYC (borough-level guidance, building/landlord/broker norms that actually differ block to block) beats breadth across markets. Revisit only as an explicit, deliberate decision, not a gradual drift.
- No account system or server backend for now. The app is local-first (localStorage/IndexedDB) with manual JSON export/import as the sync and backup mechanism. Revisit only if multi-device or shared-household use becomes a real, requested workflow.
- No native iOS/Android app. PWA stays the target; don't add platform-specific code paths that only work in a wrapped app.
- No gamification beyond small, earned delight (progress moments already in the plan). No streaks, points, or pressure mechanics — this is a stress-reduction tool, not an engagement-maximizing one.
- No borough-level or neighborhood-level content beyond citywide NYC guidance until there's sourced, maintainable content to justify it — see `NYC Depth Strategy`.
- No monetization mechanics (ads, paywalls, upsells) folded into product decisions right now. Keep the product honest and simple; revisit as a deliberate, separate decision if it ever comes up.

## Data & Privacy Principles

This app holds a user's addresses, lease terms, deposit and payment figures, and contact info for movers and landlords. Treat that as sensitive by default:

- Local-first storage only; nothing leaves the device unless the user explicitly exports it. One narrow, existing exception: apartment listing preview fetching (`fetchListingPreview` in `apartments.js`) sends a pasted listing URL to `https://api.microlink.io` to retrieve a preview image. That's a URL, not personal/financial data, but it's worth naming explicitly here rather than leaving the "nothing leaves the device" claim technically false.
- JSON export/import is the backup mechanism. Keep import validation strict (already in place) — a corrupted or malicious backup file should never silently corrupt existing data.
- Don't collect more than the UI actively uses. This is the same discipline as the "every field earns its place" rule, applied to data retention, not just UI clutter.
- If notifications, calendar export, or any future integration is added, default to the minimum data included (e.g., "Movers arrive" not "Movers arrive at [full address], paying $[amount] cash").
- No analytics/telemetry by default. If usage insight is ever needed, it should be opt-in and stated plainly, not silently bundled in.

## Decision Log

A running log of real product/architecture decisions and the reasoning behind them, so a future session doesn't re-litigate a settled question or repeat a rejected approach. Add an entry whenever `Decision Rules`, `Non-Goals`, or the data model changes for a real reason. Keep entries to 2-3 lines.

- 2026-07-08 — Scoped the app to NYC-only for now; retired the planned `nyc` vs `generic-us` market split. Depth (borough-level guidance) beats breadth (other markets) until NYC is genuinely well-served. Regional/national support is a deliberate future decision, not a near-term default.

- Example format: `2026-06-xx — Chose nyc/generic-us as the only market split for now, not a full city picker — no sourced content existed for a third market, and an unsourced picker would imply false authority.`

## Product North Star

Moving Assistant should feel like a calm move command center: it helps someone know what matters today, avoid expensive mistakes, track apartment and moving logistics, and feel less alone in the mess of moving.

The app should reduce stress by:

- turning vague moving anxiety into specific next actions
- protecting money: deposits, mover overtime, duplicate purchases, bad apartment choices
- preserving important details: boxes, contacts, dates, receipts, apartment follow-ups
- staying useful on mobile while the user is physically packing or touring
- avoiding needless complexity, busywork, or over-tracking

Primary personas to design against, so "make it better" has a concrete target instead of "everyone":

- **The solo local mover**: one person, one city, tight timeline, cost-sensitive. Wants the shortest path from "overwhelmed" to "handled."
- **The couple/household move**: two or more people coordinating the same move. Tasks, boxes, and apartment decisions are shared, not individual — this is the strongest case for a lightweight shared/collaborative view (see Product Ideas) rather than a login system.
- **The still-apartment-hunting user**: doesn't have a signed lease yet. Needs the Apartment Tracker and comparison tooling front and center; Move Day content is noise to them for now.
- **The already-signed, DIY mover**: skips the broker/apartment-hunt workflow entirely, needs rental-truck and logistics guidance, not mover coordination.

A feature that clearly serves one persona without hurting the others is good. A feature that serves nobody in particular (competition-driven "everyone else has this") is a candidate for the Non-Goals list.

## Engineering / PM Prompt For Future Codex Work

Act as both a senior engineer and product-minded moving assistant designer.

Before changing code:

- Read the relevant existing module and match its style.
- Prefer low-risk, testable increments.
- Be token-efficient: inspect only the files needed, avoid sprawling rewrites, and stop for a checkpoint before starting another large change.
- Ask questions before implementing when ambiguity could create product churn, data risk, or a worse UX.
- Treat user ideas as raw material, not just instructions: preserve the intent, then suggest improvements, tradeoffs, or simpler alternatives when appropriate.
- Keep user data safety and migration in mind before touching state shape.
- If adding a feature, ask whether it makes moving easier in a real moment of stress.
- If improving UI, prioritize clarity, tap targets, information hierarchy, and mobile ergonomics.
- Avoid adding a new tab unless the workflow truly deserves one.
- Keep `PROJECT-PLANNING.md` updated when priorities change or work is completed.

When evaluating UX:

- The user may be tired, rushed, standing in a room, or on a phone.
- The next action should be obvious.
- Dense details are okay when they support repeated operational use, but the first screen should not feel like homework.
- Make guidance adaptive where possible within NYC: local vs long-distance move logistics, apartment hunting vs already signed, movers vs DIY, and eventually borough-level differences — not NYC vs non-NYC, which is out of scope.

## Completed

Full history lives in `CHANGELOG-UPDATES.txt` and git history — not duplicated here. When an increment finishes: remove it from `Next / Planned Work`, add a line to `CHANGELOG-UPDATES.txt`, and only add a note in this file if it changed a rule, a non-goal, or the data model in a way `Decision Log` should capture.

## Next / Planned Work

1. Profile-input audit and correction.
   - Keep `apartmentHunt` because it already hides apartment tabs/focus/actions.
   - Keep `moveStyle` because it hides Movers for DIY and now adds DIY rental/helper/loading guidance.
   - Move Profile fields currently in setup all have behavior. Keep this audit item only as a guardrail when adding new profile inputs.

2. Continue module extraction.
   - `dashboard.js` is extracted.
   - `rooms.js` is extracted.
   - `utilities.js` is extracted.
   - `dayof.js` is extracted.
   - `savings.js` is extracted.
   - `supplies.js` is extracted.
   - `tasks.js` is extracted for timeline/guidance rendering; timeline calculation remains in `app.js` because focus recommendations also use it.
   - No obvious remaining extraction candidate is queued; pick the next one only when it makes product work safer.
   - Keep each extraction behavior-preserving and tested.

3. Continue Dashboard/mobile UX refinement.
   - Dashboard deadlines now group into `Today`, `This Week`, and `Later` lanes.
   - First-pass Dashboard deadline chips are in for move day, mover/DIY confirmation, apartment follow-ups/applications/cashier checks, utility dates, and internet equipment return.
   - The first shared deadline helper is extracted in `deadlines.js`; keep using it before adding more one-off deadline sources.
   - Deadline calendar export now uses the same shared helper; keep the `.ics` payload intentionally minimal.
   - Snooze / not-relevant controls are live with stable IDs and Undo; extend only if real use shows a need for a dismissal manager.
   - Mobile quick actions now keep Today and Boxes within thumb reach, with Add Box and Find Box shortcuts inside Box Inventory.

4. Continue first-week/post-move closeout only if it proves useful.
   - Initial first-week checklist is live inside Move Day.
   - First-week follow-ups now flow into shared Dashboard deadlines and calendar export.
   - Dashboard guidance is now time-aware after move day and prioritizes the next unfinished first-week closeout task.
   - A specific deposit-return due date now feeds Dashboard deadlines and calendar export, and can be marked resolved.
   - Move Day now leads with a focused one-action run mode and can print/save a compact move packet for offline or household use.

5. Extend the shared "dated item" primitive only through real consumers.
   - The normalized shape — due date, status, source module, optional cost, and short label — is live in `deadlines.js`.
   - Dashboard deadline chips and `.ics` export consume the shared shape; keep new dated features on this path instead of adding bespoke implementations.
   - An optional cost field on the same primitive is what lets budget-vs-actual fall out of it almost for free — see `Product Ideas`.

6. Build an applicability engine once a third profile field gates content.
   - Today `apartmentHunt` and `moveStyle` each gate visibility with their own conditional. Once another field gates content, replace the scattered `if` checks with one function that takes the Move Profile and returns which tabs/sections apply.
   - Do this refactor right when the third gate lands, not before — two conditionals don't yet justify the abstraction.

## Sleek & Fun — Identity Ideas

The plan so far is strong on "useful," lighter on "the app people actually enjoy opening." A few ideas to round that out, all consistent with `Non-Goals` (no pressure mechanics, no streaks) — this is about personality and polish, not engagement-maximizing gamification:

- **A consistent small visual identity, not just clean UI.** One recurring motif (the moving truck already exists as an asset) used sparingly at key moments — first open, move-day mode, the final "you did it" screen — does more for "sleek" than uniform styling alone.
- **A move recap / "wrapped" screen at the end.** Total boxes packed, rooms completed, money saved (ties directly into the budget tracker idea), days from chaos to done. One shareable, screenshot-worthy card at move completion — the kind of thing that makes someone show a friend, which is the actual mechanism by which "everyone wants to use it" happens organically.
- **Witty, specific empty states and copy**, extending what's already strong in the product (the existing neighborhood empty-state copy — "so this stops feeling like a one-person app" — is a good example of the tone to keep reaching for).
- **A distinct visual/tonal mode for Move Day**, already planned as a "calmer run-sheet mode" — worth explicitly deciding whether calmer means quieter (muted colors, fewer elements) or more focused (larger type, one task at a time), since those are different design directions.
- **Small, earned motion** — a satisfying check-off animation, a box "packed" state transition — cheap to build, disproportionately makes an app feel alive. Keep it to the same "small, earned delight" bar as the existing celebration-moment work; don't let this balloon into a design system project.

None of this should get built before the functional backlog above — it's here so it doesn't get lost, and so "make it sleek and fun" is a set of concrete candidates rather than a vibe to remember later.

## NYC Depth Strategy

The app is NYC-only for now — see `Non-Goals`. The strategy question isn't "which markets" anymore, it's "how granular within NYC." Do not pretend to know every neighborhood's specifics by default; borough-level or finer advice is only useful when it's sourced, bounded, and visibly different from citywide guidance.

Recommended approach:

- Treat `nyc` as the only market for now. There is no `generic-us` fallback to fall back to — if a piece of guidance can't be stated with NYC-level confidence, cut it or source it, don't generalize it.
- Use `borough` (Manhattan, Brooklyn, Queens, Bronx, Staten Island) as the first candidate split within NYC, and only add it to the Move Profile once it visibly changes advice — same "every field earns its place" bar as any other input.
- Good borough-level candidates: alternate-side parking and truck-loading rules, building-type mix (walk-up prevalence varies a lot by borough/neighborhood), local sanitation/bulk-pickup rules, and borough-specific permit offices.
- Add finer-than-borough packs (neighborhood-level) only when there's enough durable, sourceable guidance to justify them — this is a later step, not a near-term one.
- Every NYC-specific claim should list what it covers and cite or link to official/primary sources (NYC.gov, DOB, DSNY, FARE Act text, etc.) where laws, fees, permits, or government services are involved.
- Review NYC-specific content periodically because laws, fees, and local procedures change — the FARE Act broker-fee research already in this project is a good example of something that needs a recheck cadence, not a one-time lookup.

Candidate NYC-depth fields, in rough priority order:

- broker/leasing fee norms and legal constraints (FARE Act, security deposit limits)
- building/elevator/COI norms and move-in/move-out window rules
- alternate-side parking, truck-loading, and moving-permit rules by borough
- utility setup specifics (Con Edison/National Grid service areas)
- local apartment search sources
- donation/reuse/trash/bulk pickup links (DSNY, borough-specific)

Do not add a market or region selector to setup. If NYC depth expands, it expands as a `borough` field within the existing NYC scope, not as a signal that other markets are coming.

## UX / UI Improvement Ideas

- Make the Dashboard a calm command center rather than a collection of equal cards.
- Keep pushing the product toward a guided-coach flow: Dashboard should answer "what should I do next, why now, and what is outstanding?" before exposing tabs.
- Keep navigation compact and secondary; avoid making every tool feel like a required destination.
- Rank apartment search sources by the user's current hunt shape instead of presenting every website as equally important.
- Add `Today / This Week / Later` grouping for focus items.
- Let users snooze or mark focus items as not relevant.
- Use collapsible sections for text-heavy tabs.
- Add compact/detail modes for dense operational views.
- Add sticky mini-actions on mobile, especially `Add box`, `Search boxes`, and `Today`.
- Keep left-side navigation context visible after dashboard jumps by scrolling the active tab into view.
- Treat bulk actions like suggested box creation as reversible, with undo paths that preserve user-edited records.
- Prefer inline undo for frequent cleanup actions instead of modal confirmations that interrupt every item.
- Improve tap target sizes for status chips and tiny action links.
- Reduce inline styles as files are touched; move repeated styles into CSS classes.
- Make empty states more action-oriented.
- Give Move Day a distinct, calmer run-sheet mode.
- Keep delight small and useful: progress moments, room complete, first box, all done.

## Visual / Asset Wishlist

Useful images to add under `src/assets/`:

- `src/assets/ui/hero-moving-scene.webp`
  - Wide onboarding/dashboard image, ideally 1600x900.
  - Should feel warm, practical, and modern, not stocky or chaotic.

- `src/assets/rooms/room-kitchen.webp`
- `src/assets/rooms/room-bedroom.webp`
- `src/assets/rooms/room-bathroom.webp`
- `src/assets/rooms/room-closet.webp`
- `src/assets/rooms/room-living-room.webp`
- `src/assets/rooms/room-entry-storage.webp`
  - Square or 4:3 images/illustrations.
  - Use for room packing cards if they help scanability.

- `src/assets/placeholders/apartment-placeholder.webp`
  - Used when a listing has no photo.

- `src/assets/ui/move-day-kit.webp`
  - Keys, phone charger, tape, labels, coffee/water, documents, small box.
  - Could support Move Day or first-night kit sections.

Preferred asset conventions:

- Use lowercase kebab-case filenames.
- Prefer `.webp` for photos/illustrations.
- Use `.png` only for transparency/icons.
- Keep images inspectable and specific; avoid dark, generic, blurred stock vibes.

## Technical Backlog

- Add browser-based smoke tests if a stable local browser runner is available.
- Add state-focused tests for future migrations before changing schema.
- Add applicability-behavior test coverage — see `Next / Planned Work`, item 9.
- Consider a small docs section for running locally and testing.
- Add import preview details if backup grows more complex.
- Keep service-worker cache version bumped when shell assets change.

Product-facing ideas (printable move packet, calendar export, etc.) live in `Product Ideas` only, not duplicated here.

## Product Ideas

- Printable move packet:
  - contacts, mover window, COI/building notes, elevator slots, tip budget, open-first boxes.

- Calendar export:
  - move phases, utility start/cancel dates, apartment follow-ups, cashier-check deadlines.

- Apartment comparison scorecard:
  - commute, rent, fee, sunlight, noise, laundry, management risk, personal gut score.

- Document/photo checklist:
  - lease, COI, payment receipts, empty-apartment condition photos, key-return confirmation.

- Not-applicable controls:
  - Let a user dismiss tasks that do not apply without harming progress.

- Borough packs:
  - Now that the app is NYC-only, "region packs" means borough-level depth within NYC, not NYC-vs-elsewhere. See `NYC Depth Strategy` for the field-by-field plan.

- Local reminders (no server needed):
  - Use the Notifications API + service worker to surface "movers confirm by Friday" or "cancel old utilities today" without needing push infrastructure.
  - This is the single highest-leverage feature for the stress-reduction thesis: a command center that only speaks when opened isn't actually watching your back. Worth prioritizing over further tab polish.

- Budget: planned vs. actual:
  - First slice is live: the user can compare a rough planned move cost with the actual total and see the variance.
  - Possible later expansion: break the total into movers/truck, deposit, supplies, and misc. only if receipt-level tracking proves useful.
  - Directly serves "protecting money" in the North Star, which currently has no dedicated surface — cost protection today is implicit in mover-tip guidance only.

- Combination note — reminders, budget, deadline chips, and calendar export are one feature wearing four hats:
  - All four are really "things with a date and/or a dollar amount that need attention." Build the shared dated-item primitive (`Next / Planned Work`, item 6) once, and reminders, budget-vs-actual, printable move packet, and `.ics` export all draw from the same list instead of four separate builds.

- Lightweight shared move (no accounts):
  - For the couple/household persona: a shareable read/write link or exported state that a partner or roommate can view or merge, without building auth. Even a "share a snapshot" export/import flow (already half-built via JSON backup) closes most of the gap.
  - Evaluate against Non-Goals before building — this is the one case where "no server backend" might eventually need revisiting, so it deserves a real Decision Log entry rather than silent scope creep.
  - Smallest, lowest-risk first slice: a shared document/photo checklist, not a shared inventory or budget. "Did we take the move-out condition photos" is the classic both-assumed-the-other-did gap, and it reuses the existing Document/photo checklist idea rather than requiring new merge logic.

- First-week-in-new-place mode:
  - The move doesn't end at Move Day. A short "first week" checklist (utilities live, address changes filed, key contacts confirmed, deposit-return follow-up reminder) would close the loop the app currently drops after move-out.
  - This absorbs the deposit-return follow-up rather than tracking it separately — it's the natural last item on the first-week checklist, not a standalone feature.

## Future: Possible Productization Path (not current scope) - Consider this for any big long-term decisions that this could impact

This app is being built for one real user first, deliberately — see `Non-Goals`. This section exists so that *if* the audience question ever changes, it's a deliberate decision with a `Decision Log` entry, not something backed into by accident. Nothing here authorizes starting any of this now.

**What would actually need to change, roughly in order of when it'd bite:**

- **Data model assumptions.** Audit `moveProfile`, room/utility/box schemas, and anything else for "assumes exactly one household forever" vs. "assumes one household, extensible later." Fixing this early is a shape decision; fixing it after the schema has years of real data in it is a migration project. Doesn't require building multi-tenancy now — just avoid closing the door on it in the data layer.
- **Where personal defaults live.** Things like the default neighborhoods (Gramercy/Flatiron/Murray Hill) should stay as swappable seed values, not logic baked in multiple places, so removing "personal mode" later is a small, findable change rather than a hunt through the codebase.
- **Accounts/sync.** Currently explicitly out via `Non-Goals` (local-first, no server). Revisiting this is the single biggest pivot on this list — it touches auth, hosting cost, privacy posture (`Data & Privacy Principles` would need a real rewrite, not an amendment), and the "shared move" feature idea would become the natural on-ramp rather than a nice-to-have.
- **Distribution.** No app store presence, no SEO, no marketing surface today — a link on GitHub Pages. Even a good product needs a real answer here eventually; not solvable by engineering work alone.
- **Monetization.** Explicitly deferred in `Non-Goals`. Any productization decision should force a real answer here (free forever? subscription? one-time?) rather than let it stay implicit.

**What does *not* need to change either way:** NYC-only-first, borough depth over broad market coverage, and the whole "make it the best possible tool for one real move" build philosophy. Those are good decisions for a personal tool and a v1 product alike — narrow and deep beats broad and shallow in both cases.

**Trigger for revisiting this:** a real, specific reason (someone else asks to use it and hits a wall, or you decide you actually want to pursue this deliberately) — not a gradual drift. When that happens, it starts with a `Decision Log` entry, not a code change.
