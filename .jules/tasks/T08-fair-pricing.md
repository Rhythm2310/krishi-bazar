# T08: Fair-pricing engine and advisory UI

Wave: 7 | Model: default | Size: M | Mode: feature (design-heavy)
Branch: `jules/T08-fair-pricing` | PR title: `[T08] Fair pricing engine and advisory UI`
Skills: domain-language, tdd, codebase-design, code-review, pr
Serves: U8 | Seams under test: S1

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
A Farmer pricing a Listing sees "প্রস্তাবিত ন্যায্য দাম ৳X–৳Y (সুপারিশ ৳Z)" with a one-line human reason in the active Locale, computed from the researched reference table, the Season, the Grade and the Organic claim, blended with the platform's own completed-order median once a Category has ≥5 of them. The advice is pure, deterministic and property-tested. The Farmer's manual price always wins — the advisory never blocks, never nags, never validates the final price against the advice.

## Context pointers
- Always: `GLOSSARY.md` (Fair price, Season, Grade, Organic claim); `.jules/spec.md` story U8 + Fair-price decisions.
- Contracts you consume: `src/lib/data/taxonomy.ts` (refPricePaisa per default unit, months), `src/lib/domain/money.ts`, `src/lib/domain/units.ts` (kg conversion for per-unit translation), `src/lib/domain/clock.ts` (current month, Dhaka).

## Owned paths (write)
src/lib/domain/pricing.ts, src/lib/components/pricing/**, src/lib/i18n/bn/pricing.ts, src/lib/i18n/en/pricing.ts
Also yours: `.jules/reports/T08.md`

## Read-only inputs
src/lib/domain/{money,units,clock}.ts, src/lib/data/**, src/lib/components/ui/**, src/lib/i18n/index.ts

## Forbidden
- Any path not listed above. Any I/O inside `pricing.ts` (history arrives as a parameter). Any coupling of validation to the advice (spec: advisory only).

## Steps
1. Design the module interface first and freeze it in the file header comment: `fairPrice(input: { categoryId, grade, organic, unitId, month, historyPaisaPerUnit: number[] }, now?) → { minPaisa, fairPaisa, maxPaisa, reasonKey, reasonParams }`. All money integer paisa; `historyPaisaPerUnit` = unit prices (paisa, normalized to `unitId`) of completed orders in the category, newest first, caller caps at 20.
2. Model factors (Slice, U8, S1, red first per factor): base = category `refPricePaisa` converted from the default unit to `unitId` via kg-equivalents (mass/volume exact; count units via avgKg ratios — round half-up); season factor: month ∈ category.months → 0.90; category has months and month ∉ → 1.15; months null → 1.00. Grade factor: premium 1.25, grade_1 1.00, grade_2 0.85. Organic factor: 1.15 when true. fair = roundHalfUp(base × season × grade × organic). Tests: each factor in isolation and one combined case with hand-computed paisa.
3. Platform blend (Slice, U8, S1): when `historyPaisaPerUnit.length ≥ 5`, fair = roundHalfUp(0.5 × modelFair + 0.5 × median(history)); below 5, model only (test the 4-vs-5 boundary and even/odd medians).
4. Band + reason (Slice, U8, S1): min = roundHalfUp(fair × 0.85), max = roundHalfUp(fair × 1.20); reasonKey picks the dominant factor in priority order history → season → organic → grade → base, with params for interpolation (`{ percent }`, `{ monthsAway? }` — keep params simple strings/numbers); every key exists in both dictionaries (e.g. `pricing.reason_in_season`, `pricing.reason_history_blend`, `pricing.reason_organic`, `pricing.reason_grade_premium`, `pricing.reason_base`). Invariant tests: min ≤ fair ≤ max always.
5. Property tests (fast-check over the real taxonomy × grades × organic × all 12 months × random histories): monotonic in grade (premium ≥ grade_1 ≥ grade_2 for identical inputs); organic ≥ non-organic; min ≤ fair ≤ max; unit conversion consistency — `fairPrice(unit=kg)` × kgEquivalent(1 মণ) ≈ `fairPrice(unit=maund)` within 1 paisa rounding; determinism (same input twice → identical output). ≥200 runs each.
6. `src/lib/components/pricing/FairPriceAdvice.svelte` (Slice, U8): props `{ categoryId, grade, organic, unitId, historyPaisaPerUnit, month, onApply(fairPaisa) }`; renders the band via `formatTaka`, the localized reason line, an "apply" Button firing `onApply`, and a muted "advisory only — your price decides" note (dictionary copy). Recomputes on any prop change via the pure function (import from `$lib/domain/pricing` — it is isomorphic). Accessible: advice region `aria-live="polite"`.
7. Dictionaries `bn/en/pricing.ts` incl. all reason keys and UI copy. Parity test enforces both.
8. Self-review pass (skill `code-review`): Spec then Standards — hunt floats (factor multiplication must go through integer helpers or explicit roundHalfUp at each step; document the rounding order in the file header).

## Acceptance criteria
1. `bun run test:unit -- src/lib/domain/pricing` green incl. properties; `src/lib/domain` coverage stays ≥95/95.
2. Story U8 (advice portion) verified by `pricing.test.ts` at S1: factors, boundary 4/5 history, band invariant, reason priority.
3. Rounding order documented: every intermediate product is rounded half-up to integer paisa exactly where the tests pin it — the golden combined case in tests matches a hand computation shown in a test comment.
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Factors are constants inside `pricing.ts` (not rates.ts — rates.ts is frozen; pricing factors belong to the engine and are equally editable at the top of the file, exported as `PRICING_FACTORS` for tests).
- History median uses the lower middle element for even counts (deterministic; document).
- Month comes from `clock.todayDhaka()` at the call site (server), passed in as a prop — the component never reads the clock.

## Fallbacks
- If a taxonomy category's default-unit conversion is ambiguous (count unit with no avgKg — the T04 integrity test forbids it), throw a typed error; do not guess.

## Hand-off
Report at `.jules/reports/T08.md`. For T09: mount `<FairPriceAdvice>` beside the price Field; compute `historyPaisaPerUnit` in the create-listing load function (completed orders for the category, normalized via `units.kgUnitPrice`-style conversion) and pass `month` from the server load. `onApply` fills the price input (taka string via `paisaToTakaStr`).
