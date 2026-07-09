# Moving Assistant Planning Notes

This is the living planning file for the project. It should help Codex act as a high-quality engineer/PM partner, not just store a list of ideas.

## How To Use This File

At the start of future work:

- Read `Current Focus`, `Decision Rules`, and the relevant backlog section.
- If the user's request conflicts with this file, follow the user but update this file after the decision.
- If the request is ambiguous, ask concise clarifying questions before creating churn.
- If the request is clear and low-risk, act directly and verify.
- Keep changes small enough to finish, test, and summarize before the next checkpoint.
- Do not add UI inputs before the reason is planned end-to-end: what the user enters, how the app uses it, what advice/UI changes, and why it saves time or stress.

At the end of each meaningful increment:

- Move finished items from `Next / Planned Work` into `Completed`.
- Add new ideas we discuss before they disappear into chat history.
- Prune ideas that no longer fit the product.
- Prefer small, shippable increments with tests.
- Keep the app focused on making moving feel calmer, clearer, and less expensive.
- Codex has limited working context/tokens: choose efficient next steps, avoid biting off too much at once, and check in after each meaningful verified increment.
- Ask concise clarifying questions when something important is unclear, and think critically about user requests: suggest stronger product/engineering ideas when they would better serve the app.

## Current Focus

Default next direction unless the user says otherwise:

1. Audit the current Move Profile inputs and make each one earn its place.
2. Implement useful applicability behavior before adding any more setup fields.
3. Use `nyc` vs `generic-us` as the first market split only if it visibly changes advice.
4. Continue module extraction only when it makes the next product work safer.
5. Improve Dashboard/mobile UX in small verified passes.

Current product thesis: make the app feel adaptive without adding form tax. The app should not show every moving workflow to every user, but it also should not ask for context that it does not immediately use.

## Recent Product Decision

Do not add inputs speculatively. Every visible field should have an end-to-end reason:

- What does the user enter?
- What changes in the app immediately?
- What irrelevant UI or advice disappears?
- What better guidance appears?
- Why does this save time, money, or stress?

If those answers are weak, remove the field, hide it until the behavior exists, or keep the idea in planning instead of shipping it in the UI.

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

## Product North Star

Moving Assistant should feel like a calm move command center: it helps someone know what matters today, avoid expensive mistakes, track apartment and moving logistics, and feel less alone in the mess of moving.

The app should reduce stress by:

- turning vague moving anxiety into specific next actions
- protecting money: deposits, mover overtime, duplicate purchases, bad apartment choices
- preserving important details: boxes, contacts, dates, receipts, apartment follow-ups
- staying useful on mobile while the user is physically packing or touring
- avoiding needless complexity, busywork, or over-tracking

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
- Make guidance adaptive where possible: local vs long-distance, apartment hunting vs already signed, movers vs DIY, NYC vs non-NYC.

## Completed

- Added dependency-free Node smoke tests with `npm test`.
- Added `npm run check:js` syntax checks.
- Covered script order, cached assets, tab config, default state shape, migration, and backup summary behavior.
- Centralized valid tab IDs in `MovingApp.TAB_IDS`.
- Made JSON backup import safer by rejecting unrelated JSON and showing a summary before replacing data.
- Extracted Apartment Hunt / Apartment Tracker behavior into `src/js/apartments.js`.
- Extracted Box Inventory rendering and handlers into `src/js/boxes.js`.
- Added `boxes.js` to app script order, service-worker cache, and tests.
- Extracted Movers rendering, tip summary logic, and mover/tip handlers into `src/js/movers.js`.
- Added `movers.js` to app script order, service-worker cache, syntax checks, and smoke tests.
- Completed the first Dashboard UX hierarchy pass: primary `Do next` action, `Up next` items, compact status signal cards, and better mobile stacking.
- Added the first Move Profile fields to setup/edit details: city/market, apartment hunt needed, move help, move distance, and building type.
- Added first applicability behavior: hide apartment-hunt tools/focus when not needed, hide Movers for DIY moves, and redirect hidden active tabs back to Dashboard.

## Next / Planned Work

1. Profile-input audit and correction.
   - Keep `apartmentHunt` because it already hides apartment tabs/focus/actions.
   - Keep `moveStyle` because it already hides Movers for DIY, then make it add useful DIY guidance.
   - Make `buildingType` alter COI/elevator/building guidance, or remove it from setup until it does.
   - Make `distance` alter timeline/move-day guidance, or remove it from setup until it does.
   - Make `city` drive a real `nyc` vs `generic-us` content split, or move it back to Apartment Hunt only.

2. First useful market behavior: `nyc` vs `generic-us`.
   - For `generic-us`, hide/soften NYC-specific legal claims, broker-fee notes, and NYC mover assumptions.
   - Label the built-in mover list as NYC starter defaults.
   - For non-NYC moves, emphasize custom local quotes and generic building/landlord confirmation.
   - Use official/primary sources before adding any city-specific legal/permit claims.

3. First useful DIY behavior.
   - Replace mover quote emphasis with rental vehicle, parking/loading, dollies, helpers, heavy-item risk, and loading-order guidance.
   - Add DIY move-day reminders only when `moveStyle` is `diy`.

4. Building-type guidance.
   - Apartment/building: COI, elevator, super/doorman, loading dock, move windows.
   - House/standalone: driveway/street access, garage/basement staging, trash pickup, utility shutoff, stairs/large-item path.

5. Continue module extraction.
   - Candidate modules: `rooms.js`, `dashboard.js`, `utilities.js`.
   - Keep each extraction behavior-preserving and tested.

6. Continue Dashboard/mobile UX refinement.
   - Consider `Today`, `This Week`, and `Later` task lanes.
   - Add clearer deadline chips for apartment follow-ups, utility dates, mover confirmation, and cashier-check deadlines.
   - Explore snooze / not relevant controls after Move Profile exists.

## City / Market Pack Strategy

Do not pretend to know every city by default. City-specific advice is only useful when it is sourced, bounded, and visibly different from generic guidance.

Recommended approach:

- Start with two market profiles: `nyc` and `generic-us`.
- Use `generic-us` for unknown cities instead of making unsupported local claims.
- Add city packs only when there is enough durable, sourceable guidance to justify them.
- Each city pack should list what it changes: legal/fee notes, permit/parking guidance, utility reminders, mover/building logistics, and apartment-search sources.
- City packs should cite or link to official/primary sources where laws, fees, permits, or government services are involved.
- Review city packs periodically because laws, fees, and local procedures change.

Candidate city-pack fields:

- rental/application/deposit rules
- broker or leasing fee norms and legal constraints
- moving truck parking permits or curb rules
- building/elevator/COI norms
- utility setup gotchas
- local apartment search sources
- donation/reuse/trash/bulk pickup links

Avoid adding or keeping a city selector in setup unless at least `nyc` vs `generic-us` creates useful visible behavior.

## UX / UI Improvement Ideas

- Make the Dashboard a calm command center rather than a collection of equal cards.
- Add `Today / This Week / Later` grouping for focus items.
- Let users snooze or mark focus items as not relevant.
- Use collapsible sections for text-heavy tabs.
- Add compact/detail modes for dense operational views.
- Add sticky mini-actions on mobile, especially `Add box`, `Search boxes`, and `Today`.
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
- Consider a small docs section for running locally and testing.
- Consider a generated export/printable move packet.
- Add `.ics` calendar export for key deadlines.
- Add import preview details if backup grows more complex.
- Keep service-worker cache version bumped when shell assets change.

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

- Region packs:
  - NYC defaults are strong, but should become one market profile rather than universal app behavior.
