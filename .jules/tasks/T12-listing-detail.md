# T12: Listing detail page and gallery

Wave: 11 | Model: default | Size: M | Mode: feature
Branch: `jules/T12-listing-detail` | PR title: `[T12] Listing detail page and gallery`
Skills: domain-language, tdd, code-review, pr
Serves: U3 | Seams under test: S2, S3

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
`/p/[id]` shows one Listing completely: photo gallery, freshness badge with the best-before date, grade with its codified definition popover, organic self-declaration note, per-unit price with ≈৳/kg conversion, remaining Stock, harvest date, description, and the Farmer's identity with a tappable phone link. Paused/deleted/zero-stock Listings are visible only to their owning Farmer (preview). Per-Listing OG/meta tags make shared links rich. The order box arrives in T13 — this page renders an availability line instead, structured so T13 mounts the OrderBox in one place.

## Context pointers
- Always: `GLOSSARY.md` (Listing, Freshness, Grade, Organic claim, Stock); `.jules/spec.md` U3 + Freshness decisions.
- Contracts: `src/lib/domain/freshness.ts`, `src/lib/domain/units.ts`, `src/lib/data/taxonomy.ts` (category names, grade copy keys), `src/lib/server/market.ts` (row shape, FreshnessBadge component).

## Owned paths (write)
src/routes/p/[id]/**, src/lib/components/listings/detail/**, src/lib/i18n/bn/detail.ts, src/lib/i18n/en/detail.ts, e2e/detail.spec.ts
Also yours: `.jules/reports/T12.md`

## Read-only inputs
src/lib/domain/**, src/lib/data/**, src/lib/db/**, src/lib/components/{ui,market,layout}/**, src/lib/i18n/{index,format}.ts, src/lib/seo? (does not exist yet — write page-level meta inline; T19 adds shared defaults)

## Forbidden
- Any path not listed above. Exposing buyer PII (none exists yet) or farmer phone on any page other than this detail page. Building any part of the order flow (T13).

## Steps
1. `src/routes/p/[id]/+page.server.ts` (Slice, U3, S2, red first): `load` fetches the listing + farmer by id; visibility rule — `status='active' && qty>0` for everyone; `paused|deleted|qty=0` only when `locals.farmer?.id === listing.farmer_id` (owner preview, with a localized "not publicly visible" banner flag in the data); otherwise `error(404)`. Data assembled server-side: category (bn/en from taxonomy), freshness via `freshnessOf(categoryId, harvest_date, todayDhaka())` incl. bestBefore, `kgPricePaisa` via `units.kgUnitPrice`, district localized name, farmer `{ village, district, phone }`, photos array. Tests via `withTestDb`: active visible anon; paused hidden anon → 404; paused visible owner; deleted hidden owner too? — NO: deleted is 404 for everyone incl. owner (soft-deleted is gone; T16's manage page is the only place it appears); zero-stock visible to all (badge "স্টক নেই" state) per spec marketplace rule? — spec hides qty=0 from the marketplace list but the DETAIL page stays reachable with an out-of-stock availability line (orders arrive in T13 gated on stock). Pin exactly this in tests.
2. `src/routes/p/[id]/+page.svelte` + `+page.ts` (`export const prerender = false`): Gallery (main image + thumbnail strip, 1–3 photos, placeholder when empty; all `img` with width/height + eager only for the first), title row (name + FreshnessBadge reused from market), best-before line (`formatDate`), price block (per-unit `formatTaka` + `formatQty` unit label + ≈৳/kg when unit ≠ kg), stock line, meta list (category, grade with definition popover — ui Badge + `title`/dialog-less popover via details/summary for no-JS, organic note when claimed, harvest date, district+village), Farmer contact card (village, district, phone `tel:` link — the only surface showing farmer phone), description block with `white-space: pre-line`, availability slot: `qty>0 && active` → localized "অর্ডার করতে প্রস্তুত" line (T13 replaces this slot with OrderBox — mark the insertion point with an HTML comment `{/* OrderBox mounts here (T13) */}` — comments allowed, placeholder copy is not), owner-preview banner when flagged.
3. Meta/OG: `<svelte:head>` — title `${name} — কৃষি বাজার` (localized brand), description = first 150 chars of description or category+district fallback, `og:title/og:description/og:image` (first photo or `/placeholder.webp` absolute-ized via `$env/dynamic/public`'s PUBLIC site URL? — no such env exists: use relative og:image (Vercel resolves absolute from the deployment URL is FALSE — og needs absolute). Decision: add `PUBLIC_SITE_URL` to `.env.example`? That file is T01-owned — file a request in T12 and until granted use `event.url.origin` from the load's `url` param (SvelteKit provides `url` in load — absolute origin at request time). Use `url.origin`. Tests: og:title/og:image present and absolute.
4. `src/lib/components/listings/detail/`: Gallery.svelte, PriceBlock.svelte, FarmerCard.svelte, MetaList.svelte (small, presentational, token-styled).
5. `e2e/detail.spec.ts` (Slice, U3, S3, red first): seed one active listing (globalSetup seeding mechanism from T11 — reuse), visit card→detail: gallery renders, badge + best-before visible, farmer phone link has `tel:` href, price shows Bengali numerals in bn and ASCII in en (toggle), 404 page for a random uuid, axe zero violations on detail.
6. Dictionaries `bn/en/detail.ts`. Parity enforced.
7. Self-review pass (skill `code-review`): Spec then Standards — visibility matrix fully covered by tests; no layout shift (image dims); CLS-safe popover.

## Acceptance criteria
1. `bun run test:unit -- src/routes/p` (or co-located `+page.server.test.ts`) green across the full visibility matrix.
2. Story U3 verified at S2 by the load tests and at S3 by `e2e/detail.spec.ts`.
3. `curl -s <preview>/p/<seeded-id> | grep -o 'og:image[^>]*'` shows an absolute URL.
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Deleted listings: 404 for everyone; paused/zero-stock: owner-only preview / public out-of-stock respectively (pinned above).
- Grade definitions live in dictionaries (`listings.grade_premium_def` etc. from T09's files — reuse keys, add none); the popover component is details/summary (works without JS).
- Phone link formatting: `tel:+8801XXXXXXXXX` from the normalized stored form.

## Fallbacks
- If reusing T09's grade definition keys crosses ownership (they live in `listings.ts` dictionaries — read-only for you), duplicate them into `detail.ts` under `detail.grade_*` keys and file a request to consolidate; parity tests keep both locales in sync.

## Hand-off
Report at `.jules/reports/T12.md`. For T13: the availability slot comment marks the OrderBox mount point; `load` already exposes `qty`, `unitId`, `categoryId`, `pricePaisa` for the estimate. For T15: the detail page structure shows where CommentSection mounts (after description, before footer).
