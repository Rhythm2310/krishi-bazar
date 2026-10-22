# T16: Farmer listing management — edit, pause, delete

Wave: 15 | Model: default | Size: M | Mode: feature
Branch: `jules/T16-listing-management` | PR title: `[T16] Farmer listing management edit pause delete`
Skills: domain-language, tdd, code-review, pr
Serves: U9 | Seams under test: S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
A Farmer manages their storefront: `/farmer/listings` lists their own Listings (any status except deleted, with stock, status badge, order count), each with pause/resume, soft-delete, and edit — edit reuses T09's ListingForm in `mode='edit'` (price, qty, description, photos, grade, organic, harvest, village; category and unit are immutable after creation because orders reference them). Paused and deleted Listings vanish from the marketplace (T11's status gate); existing Orders are untouched by every management action. The farmer dashboard home gains the real navigation links.

## Context pointers
- Always: `GLOSSARY.md` (Listing, Stock); `.jules/spec.md` U9 + Listing-management decisions.
- `.jules/reports/T09.md`: ListingForm props `{ mode: 'create'|'edit', initial?, actionName }`. `.jules/reports/T13.md`: order-count definition.
- Contracts: `src/lib/db/schema.ts` (listings.status), `src/lib/domain/validate.ts` (listingSchema), `src/lib/server/market.ts` (visibility gate you must not break).

## Owned paths (write)
src/routes/farmer/listings/**, src/routes/farmer/+page.svelte, src/lib/server/listings/**, src/lib/components/listings/**, src/lib/i18n/bn/manage.ts, src/lib/i18n/en/manage.ts, e2e/manage.spec.ts
Also yours: `.jules/reports/T16.md`

## Read-only inputs
src/lib/domain/**, src/lib/db/**, src/lib/components/{ui,photos,pricing}/**, src/lib/server/{auth,orders}/**, src/routes/farmer/+layout.server.ts

## Forbidden
- Any path not listed above — note `src/routes/farmer/listings/new/**` is inside your glob but T09's create flow works: changing create behaviour is out of scope (regression tests guard it). Changing category/unit of an existing Listing. Hard deletes.

## Steps
1. `src/lib/server/listings/manage.ts` (Slice, U9, S2, red first): `listForFarmer(db, farmerId)` → own listings except deleted, newest first, each with `orderCount` (count of orders on the listing with status ≠ cancelled — single grouped query, no N+1); `updateListing(db, { farmerId, listingId, form })` → ownership check (missing/foreign → not-found class error), validate via listingSchema minus category/unit (assert submitted category/unit equal stored values, else keyed error), apply (qty delta is direct set — NOT stock.ts, which is order-flow only; document why in the file header), preserve photos order ≤3; `setStatus(db, { farmerId, listingId, next: 'paused'|'active' })` from active↔paused only (machine-style guard: deleted is terminal); `softDelete(db, { farmerId, listingId })` → status deleted from any non-deleted state. Tests via `withTestDb`: ownership matrix (foreign farmer → not-found for all four ops); edit persists every editable field; category-change attempt rejected; pause→market query (call `searchListings`) hides it; resume shows it; delete hides it and keeps its orders countable; orderCount excludes cancelled; editing qty does not touch existing orders' qty/totals.
2. `/farmer/listings/+page.server.ts` + `.svelte` (Slice, U9): manage list — cards with thumbnail (or placeholder), name, status Badge (active/paused tones), stock via `formatQty`, orderCount, created `formatDate`; actions row: edit link, pause/resume POST, delete POST with a confirm dialog (ui primitive or `confirm()` fallback — pick the accessible dialog, dictionary copy); EmptyState with CTA to `/farmer/listings/new`. `?/setStatus` and `?/delete` actions call manage.ts, redirect back with `?ok=<key>` flash.
3. `/farmer/listings/[id]/edit/+page.server.ts` + `.svelte`: load own listing (not-found otherwise) → `<ListingForm mode="edit" initial={...} actionName="update"/>`; category/unit selects rendered disabled with a localized "immutable after first order window" hint; success → redirect `/p/[id]`. If ListingForm lacks an edit affordance T09 promised, extend it inside your owned `src/lib/components/listings/**` without changing create-mode behaviour (its e2e must stay green).
4. `/farmer/+page.svelte` deepening (you own it now): real dashboard — greeting, three cards: my listings (count → /farmer/listings), received orders (link → /farmer/orders, T13's route), add new listing (→ /farmer/listings/new); logout stays.
5. `e2e/manage.spec.ts` (Slice, U9, S3, red first): seeded farmer + 2 listings (globalSetup mechanism): manage page shows both with counts; edit price → detail page shows new price; pause → home marketplace no longer shows it → resume → shows again; delete → gone from manage list and 404 on detail (T12 rule); second farmer cannot reach `/farmer/listings/<firstFarmerListingId>/edit` (redirect/404).
6. Dictionaries `bn/en/manage.ts`. Parity enforced.
7. Self-review pass (skill `code-review`): Spec then Standards — create-flow regression green, no stock.ts bypass confusion (documented), accessible confirm.

## Acceptance criteria
1. `bun run test:unit -- src/lib/server/listings` green (create suite from T09 still passes + manage suite).
2. Story U9 verified at S2 (manage.test.ts ownership matrix) and S3 (`e2e/manage.spec.ts`).
3. `bun run test:e2e -- listing-create` still green (no create regression).
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Qty edits set the value directly (farmer restock); order reservations remain atomic — document the two paths in manage.ts header.
- Deleted listings keep their orders/comments reachable via the farmer dashboard (order rows show the product name snapshot? — orders already join listings; deleted listing name still renders, marked (মুছে ফেলা) via dictionary).
- Confirm dialog: `<dialog>` element with ui Button styling (no JS-lib).

## Fallbacks
- If ListingForm's edit mode needs structural change beyond props (e.g. server-driven initial photos), refactor inside `src/lib/components/listings/**` keeping the public props contract; re-run T09's e2e as the regression gate.

## Hand-off
Report at `.jules/reports/T16.md`. For T17: seed must include one paused and one deleted listing to demo manage states. For T18: ownership checks are the audit focus.
