# T09: Create listing — form and action

Wave: 8 | Model: default | Size: L | Mode: feature
Branch: `jules/T09-create-listing` | PR title: `[T09] Create listing form and action`
Skills: domain-language, tdd, code-review, pr
Serves: U8 | Seams under test: S2, S3

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
A logged-in Farmer publishes a Listing: category (group→category dependent selects from the taxonomy), unit (restricted to the category's allowed units, with per-unit step), stock, price with the Fair-price advisory (manual price always wins), grade, organic claim, harvest date, district + village, 1–3 WebP photos, description. The server action re-validates everything, stores money as paisa and quantity as hundredths, and redirects to the new Listing's detail URL.

## Context pointers
- Always: `GLOSSARY.md` (Listing, Unit, Grade, Organic claim, Fair price); `.jules/spec.md` story U8 + Validation decisions.
- `.jules/reports/T07.md` (PhotoPicker contract: `photos: string[]`) and `.jules/reports/T08.md` (FairPriceAdvice props + onApply).
- Contracts: `src/lib/domain/validate.ts` (listingSchema), `src/lib/data/taxonomy.ts` + `districts.ts` (picker data), `src/lib/db/schema.ts` (listings).

## Owned paths (write)
src/routes/farmer/listings/new/**, src/lib/server/listings/**, src/lib/components/listings/**, src/lib/i18n/bn/listings.ts, src/lib/i18n/en/listings.ts, e2e/listing-create.spec.ts, e2e/fixtures/**
Also yours: `.jules/reports/T09.md`

## Read-only inputs
src/lib/domain/**, src/lib/data/**, src/lib/db/**, src/lib/components/photos/**, src/lib/components/pricing/**, src/lib/components/ui/**, src/lib/server/auth/**, src/routes/farmer/+layout.server.ts (gate)

## Forbidden
- Any path not listed above. Trusting client-side validation alone; floats in money/qty paths; editing frozen contracts (5.7 requests instead).

## Steps
1. `src/lib/server/listings/create.ts` (Slice, U8, S2, red first): `createListing(db, { farmerId, form }, { todayDhaka })` → parse with listingSchema (qty → integer hundredths, price taka-string → paisa via `money.takaStrToPaisa`), verify unit ∈ category.units and district exists against the data modules, insert the row (status active, id `crypto.randomUUID()`), return `{ id }` or `{ fieldErrors }`. Tests via `withTestDb`: happy row (assert stored paisa/hundredths exact), every schema rejection maps to its keyed fieldError, wrong-unit-for-category rejected, harvest date tomorrow rejected, harvest older than 2×ok-window rejected, photos >3 rejected.
2. `src/routes/farmer/listings/new/+page.server.ts`: gate is inherited from `/farmer/+layout.server.ts`; `load` supplies picker data (groups, categories per group with allowed units + steps from `units.UNITS`, districts, grades, current month + `todayDhaka()` for date bounds, `historyPaisaPerUnit` per category = unit prices of completed orders normalized to the category default unit, capped 20 — empty arrays now, real once T13 ships orders; compute with a single grouped query) ; `actions.create` → `createListing` → on success `redirect(303, '/p/' + id)`, on failure re-render with fieldErrors + preserved form values. Tests (S2): load shape, action success redirect Location, action failure preserves values and returns keyed errors, unauthenticated → redirect (through the real gate).
3. `src/lib/components/listings/ListingForm.svelte` (Slice, U8): the full form built from ui primitives — dependent Group→Category selects (category list filters on group; unit select re-filters on category; qty step/min/max update per unit), price Field (taka input, inputmode decimal) with `<FairPriceAdvice>` mounted beside it (onApply fills the price input via `paisaToTakaStr`), Grade radio group with an info popover carrying the codified definitions (dictionary copy), Organic checkbox with the self-declaration note ("কৃষকের ঘোষণা — সনদবিহীন"), harvest date input (max=today, min=today−2×okDays of the chosen category — both from load data), District select + Village text, `<PhotoPicker name="photos" max={3}/>`, Name + Description fields, submit with pending state; `use:enhance` so it works without JS (advisory interactivity degrades gracefully — the form still submits). Structured for edit-mode reuse: props `{ mode: 'create' | 'edit', initial?, actionName }` (T16 passes `edit` + initial values). Localized field errors under each Field.
4. `e2e/fixtures/sample.png`: commit a small valid PNG (generate once, e.g. a 2×2 solid-color PNG written from its well-known base64; the file must be a real decodable PNG because the browser pipeline converts it).
5. `e2e/listing-create.spec.ts` (Slice, U8, S3, red first): register+login a farmer (reuse T06 UI flow), open /farmer/listings/new, fill every field (category ইলিশ, unit কেজি, qty 5, price: assert the advisory renders a ৳ band and the reason line, click apply → price input equals the advised taka string, then override manually to a different value), attach `sample.png` via PhotoPicker (assert a webp preview appears — the real conversion pipeline ran in local storage mode), submit → lands on `/p/<id>` (page exists as a 404 shell until T12 — assert the URL and that the listings table has the row via the UI redirect only; no direct DB access in e2e), then re-open /farmer/listings/new and submit an invalid form (harvest tomorrow) → localized error under the field, values preserved.
6. Dictionaries `bn/en/listings.ts` (labels, placeholders, grade definitions, organic note, errors). Parity enforced.
7. Self-review pass (skill `code-review`): Spec then Standards — money path check (no float between form and DB), ListingForm edit-mode props actually generic (deletion test: could T16 reuse without modification? if not, generalize now).

## Acceptance criteria
1. `bun run test:unit -- src/lib/server/listings` green (create suite incl. every rejection class).
2. Story U8 verified by `create.test.ts` at S2 and `e2e/listing-create.spec.ts` at S3 (advisory shown, applied, then overridden — the override value is what stores).
3. Stored row for the e2e happy path has `price_paisa` = the overridden price × 100 and `qty` = 5.00 (assert in the S2 happy test with identical inputs).
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Price input accepts taka with up to 2 decimals; conversion via `takaStrToPaisa` only.
- Qty input step per unit kind: mass/vitreous 0.5 (kg/litre), maund 0.25, count 1 — values come from `units.UNITS`, never hardcoded in the component.
- Category picker: two selects (group, then category) — searchable combobox is bloat for v1.
- History query may return empty until orders exist; pass `[]` — the advisory handles it (T08 boundary).

## Fallbacks
- If `use:enhance` return-value plumbing of fieldErrors fights the SvelteKit version, use the standard `setFormErrors`-style pattern from the pinned SvelteKit docs (form action result via `$page.form`); never client-fetch mutations.
- If the PNG fixture fails browser conversion in the CI chromium build, retry once with `--with-deps` installed (setup already does); if it still fails, record `[PARTIAL]` for the photo assertion only — the rest of the flow must stay green.

## Hand-off
Report at `.jules/reports/T09.md`. For T11: listings exist to browse; `placeholder.webp` for photo-less cards. For T12: `/p/[id]` is yours to build — the create action already redirects there. For T16: `ListingForm` accepts `mode='edit'` + `initial`; reuse it, don't fork it.
