# T11: Marketplace browse — search, filters, sort, pagination

Wave: 10 | Model: default | Size: L | Mode: feature
Branch: `jules/T11-marketplace-browse` | PR title: `[T11] Marketplace browse search filters pagination`
Skills: domain-language, tdd, code-review, pr
Serves: U1, U2 | Seams under test: S2, S3

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
The home page is the marketplace: every buyer-facing query rule lives in one server module — only active Listings with stock > 0, ILIKE name search, filters (group→category, grade, organic, district), three sorts (newest harvest default, price asc, price desc), keyset pagination on the default sort (24/page) and offset pagination on price sorts — rendered as accessible cards with freshness, grade and organic badges, per-unit price plus ≈৳/kg conversion, farmer + village + district, and localized empty states.

## Context pointers
- Always: `GLOSSARY.md` (Listing, Freshness, Category, District, Stock); `.jules/spec.md` U1, U2 + Marketplace-scale decisions.
- Contracts: `src/lib/domain/freshness.ts` (badge states), `src/lib/domain/units.ts` (kg conversion), `src/lib/data/taxonomy.ts` + `districts.ts` (filter options), `src/lib/db/schema.ts`.
- `.jules/reports/T09.md`: listing rows now exist; card photo rule `photo ?? '/placeholder.webp'`.

## Owned paths (write)
src/routes/+page.svelte, src/routes/+page.ts, src/lib/server/market.ts, src/lib/components/market/**, src/lib/i18n/bn/market.ts, src/lib/i18n/en/market.ts, e2e/browse.spec.ts
Also yours: `.jules/reports/T11.md`

## Read-only inputs
src/lib/domain/**, src/lib/data/**, src/lib/db/**, src/lib/components/ui/**, src/lib/i18n/{index,format}.ts, src/routes/+layout.*

## Forbidden
- Any path not listed above. Client-side filtering of server results (the URL is the query state); `offset` pagination on the default sort.

## Steps
1. `src/lib/server/market.ts` (Slice, U2, S2, red first): `searchListings(db, params)` where params = `{ q?, groupId?, categoryId?, grade?, organic?, districtId?, sort: 'newest'|'price_asc'|'price_desc', cursor?, page? }` → `{ rows: MarketListing[], nextCursor: string | null, totalEstimate: number }`. Rules: status='active' AND qty>0 always; q → ILIKE on name (escaped `%_\`); groupId filters via the taxonomy's categories of that group (categoryId wins when both present); sort 'newest' = harvest_date DESC, created_at DESC, id ASC tiebreak with keyset cursor = base64url JSON `{h,c,i}`; price sorts = price_paisa ASC/DESC, id tiebreak, offset page (document why: cross-column keyset on price+id is v2); rows carry joined farmer (name? farmers have no name field — card shows village+district+phone-masked? per spec U1 card shows farmer identity: use `village, district` + farmer phone only on detail (privacy: no phone on cards)); freshness computed per row via `freshnessOf(category_id, harvest_date, todayDhaka())`; `kgPricePaisa` via `units.kgUnitPrice`. Tests via `withTestDb` + seeded rows: every filter alone and combined; hidden statuses/zero-stock; search case-insensitive + partial; each sort order exact; keyset page 2 has no overlap with page 1 and continues correctly after a new insertion (the keyset property); price-offset page 2.
2. `src/routes/+page.ts`/`+page.svelte`: read URLSearchParams → params (invalid enum values fall back to defaults, never throw); `load` calls `searchListings` with `todayDhaka()`; render FilterBar + SortSelect + SearchInput as one GET form (all state in the URL, shareable, no-JS works), ListingGrid of ListingCard, LoadMore (link with next cursor/page — `use:enhance` append for SPA feel), result count line, EmptyState variants (no matches vs marketplace empty — distinct copy + the farmer CTA in the empty case). Cards: photo (or placeholder) with width/height + loading=lazy, name, badges (FreshnessBadge tones good/mid/old from state, GradeBadge, OrganicBadge when true), price/unit via `formatTaka` + `formatQty`, ≈৳/kg conversion line when unit ≠ kg, farmer village + district name (localized from districts data).
3. `src/lib/components/market/`: ListingCard.svelte, FilterBar.svelte (group select drives category select options client-side from embedded taxonomy subset; organic checkbox; district select; all inputs named for the GET form), SortSelect.svelte, LoadMore.svelte, FreshnessBadge.svelte (label from `freshnessOf` labelKey via `t()`; tone class from state — this component is reused by T12).
4. `e2e/browse.spec.ts` (Slice, U1+U2, S3, red first): seed listings directly via `withTestDb`-style helper against the preview DB (export a `seedForTest(rows)` helper from your e2e file using `$lib/db/testing` — e2e runs same-process-accessible PGlite through the preview server's data dir; if the preview server locks the DB, seed through a tiny `+page.server` load-independent script run in `globalSetup` — pick one mechanism and document it); assert: card shows badge + ৳ price with Bengali numerals in bn; search filters the grid; category filter applies; sort price_asc reorders; LoadMore appends page 2 without duplicates; empty state copy for a no-match search; axe zero violations on the populated home.
5. Dictionaries `bn/en/market.ts`. Parity enforced.
6. Self-review pass (skill `code-review`): Spec then Standards — SQL injection surface (all params bound via Drizzle — no string concat), N+1 queries (one join, no per-row queries), image attributes present (CLS).

## Acceptance criteria
1. `bun run test:unit -- src/lib/server/market` green covering every rule in step 1 incl. the keyset no-overlap property.
2. Stories U1/U2 verified by `market.test.ts` at S2 and `e2e/browse.spec.ts` at S3.
3. Home with 30 seeded listings: first render shows exactly 24 cards and a working LoadMore (asserted in e2e).
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Farmer phone is NOT shown on cards (privacy decision from the spec — detail page only).
- `totalEstimate` = `count(*)` over the filtered query (cheap at this scale); display "প্রায় Nটি পণ্য".
- Filter form submits on button; selects auto-submit via `use:enhance` on change (progressive enhancement — plain form still works).
- Cursor/page params validated with zod; invalid → default sort, page 1.

## Fallbacks
- If keyset tiebreaking on equal harvest dates flaps in tests, extend the cursor key with `created_at` — keep it deterministic and re-run the no-overlap property.
- If the e2e seeding mechanism collides with the preview server's PGlite lock, switch to `globalSetup` seeding (one place), never to skipping the seeded assertions.

## Hand-off
Report at `.jules/reports/T11.md`. For T12: reuse `FreshnessBadge`; `MarketListing` row type lives in `market.ts`. For T16: pause/delete must make listings vanish here — the status filter is the single gate.
