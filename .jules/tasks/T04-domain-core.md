# T04: Market data modules and domain core

Wave: 3 | Model: default | Size: L | Mode: foundation
Branch: `jules/T04-domain-core` | PR title: `[T04] Market data modules and domain core`
Skills: domain-language, tdd, codebase-design, code-review, pr
Serves: infrastructure (enables U1, U4, U8, U10, U12) | Seams under test: S1

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
Every business rule of Krishi Bazar exists as pure, exhaustively tested domain code before any feature touches it: paisa money, the 9-unit Bangladesh unit system with kg-equivalents (মণ = 40 kg), per-category freshness, the order state machine with 24h expiry, IP rate-limit windows, and all zod validation schemas — plus the frozen rates config. Coverage gates switch on here.

## Context pointers
- Always: `GLOSSARY.md`; `.jules/spec.md` (Money, Units, Freshness, Orders lifecycle, Validation, মণ decision); `docs/adr/0002-money-integer-paisa.md`.
- Contracts you consume and test, never edit except `taxonomy.ts`/`rates.ts` which you own: `src/lib/data/taxonomy.ts`, `src/lib/data/districts.ts`.

## Owned paths (write)
src/lib/domain/**, src/lib/data/taxonomy.ts, src/lib/data/rates.ts, vitest.config.ts
Also yours: `.jules/reports/T04.md`

## Read-only inputs
src/lib/data/districts.ts, src/lib/db/schema.ts (enum value names must match), src/lib/i18n/format.ts

## Forbidden
- Any path not listed above. I/O of any kind inside `src/lib/domain/**` except `clock.ts` reading the current time through its injected parameter defaults.
- Floats in any money path (ADR-0002); new dependencies.

## Steps
1. `src/lib/data/rates.ts` (frozen contract): delivery surcharges per kg in paisa (`express: 1500`, `standard: 500`) with bn/en label keys and promised days (1/3); rate-limit windows per kind (auth 5/hr; order 10/hr; comment 3/hr + 10/day; upload 20/hr); session lifetime 30 days; order expiry 24h; pagination 24; photo limits (max 3, max edge 1600, quality 0.82, max bytes 2_097_152, accepted source types jpeg/png/webp); listing validation bounds (price 100–10_000_000 paisa per unit; qty 50–1_000_000 hundredths for mass/litre, 1–10_000 units for counts; name ≤120; description ≤1000; village ≤120; address ≤500; comment body ≤600; harvest not older than 2× the category ok-window). Done when: every number above lives here and nowhere else.
2. `src/lib/domain/clock.ts`: `todayDhaka(now = new Date()): string` (YYYY-MM-DD via `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' })`), `daysSinceDhaka(iso, now)`, `nowUtc()`. All "today" logic in the product flows through this module. Slice 1 (U8, S1) red first: a UTC instant just before/after Dhaka midnight returns the correct Dhaka date. Done when: boundary tests green.
3. `src/lib/domain/money.ts`: quantities are **integer hundredths of a unit** (`qtyH`) everywhere in domain code. `takaStrToPaisa(s)` (half-up, rejects >2dp), `paisaToTakaStr(p, locale)` (delegates display to `format.ts`), `mulQty(pricePaisa, qtyH)` = roundHalfUp(price×qtyH/100), `addPaisa`, `kgUnitPricePaisa(pricePaisa, categoryId, unitId)` (per-kg display conversion via units). Slice (U4, S1) red first: `mulQty(4550, 150)` (৳45.50 × 1.5 kg) = 6825 exactly; half-up boundary 6824.5 → 6825. Done when: money tests green.
4. `src/lib/domain/units.ts`: `UNITS` meta (id, kind mass|volume|count, bn/en label keys, step in hundredths, min/max per rates); `kgEquivalentH(categoryId, unitId, qtyH)` using MAUND_KG=40, LITRE_KG density, category avgKg/bundleKg/basketKg/sackKg (count→kg rounds half-up to whole kg hundredths); `deliverySurchargePaisa(categoryId, unitId, qtyH, speed)` = mulQty(surchargePerKgPaisa, kgEquivalentH). Slice (U4, S1): 1 মণ চাল = 40 kg → express surcharge = 40×1500 = 60000 paisa; 1 হালি ডিম (4×0.06 kg) → surcharge rounds to 36 paisa. Done when: unit tests green incl. every unit kind.
5. `src/lib/domain/freshness.ts`: `freshnessOf(categoryId, harvestDateIso, today)` → `{ state: 'today'|'prime'|'ok'|'past', days, labelKey, bestBeforeIso }` where state = today if days 0; prime if ≤ primeDays; ok if ≤ okDays; else past; `bestBeforeIso` = harvest + okDays (Dhaka date math). Slice (U1, S1): leafy (1/3) harvested 1 day ago → prime; 3 days → ok; 4 → past; fish (0/1) harvested today → today state; harvested yesterday → ok; 2 days → past. Done when: boundary tests green for both windows of at least three categories incl. fish and grains.
6. `src/lib/domain/order-machine.ts`: states new/accepted/in_transit/delivered/cancelled; events accept, reject(reason), to_transit, deliver, buyer_cancel, expire; `transition(state, event)` → next state or `{ error: 'invalid_transition' }`; `restocksStock(event)` true for reject/buyer_cancel/expire; terminal = delivered|cancelled; `isExpired(expiresAtIso, now)`. Full 5×6 transition table asserted — every illegal pair returns the error. Done when: exhaustive table test green (30 cases).
7. `src/lib/domain/rate-limit.ts`: `hashIp(ip)` = sha256 hex of `kb:<ip>` (node:crypto — runtime-agnostic); `windowAllowed(eventTimestamps, limit, windowMs, now)` pure sliding-window check → `{ allowed, retryAfterSec }`; `limitsFor(kind)` from rates.ts. Slice (U6, S1): 3 comment events within the hour + 4th → denied with retryAfter ≤ 3600. Done when: window edge tests green (exactly-at-boundary timestamps).
8. `src/lib/domain/validate.ts`: zod 4.6 schemas sharing one error-shape `{ fieldErrors: Record<string, string-key> }`: `phoneSchema` (accepts `01XXXXXXXXX`, `+8801...`, `8801...`; normalizes to `01...`; rejects others), `registerSchema`, `loginSchema`, `listingSchema` (category exists in taxonomy; unit ∈ category.units; qty within per-kind bounds; price within bounds; harvest ≤ today and ≥ today − 2×okDays via clock; district exists; village/name/description lengths), `orderSchema` (qty > 0 and ≤ stock passed in; speed ∈ enum), `commentSchema` (name ≤80, body ≤600, optional phone normalized), `rejectSchema` (reason enum). Every failure carries a dictionary key + params, never prose. Done when: schema tests green incl. every rejection class with its key.
9. Taxonomy integrity tests (you own `taxonomy.ts` — fix data errors you find, record each fix in the report): ids unique kebab-case; every group non-empty; ≥90 categories; primeDays ≤ okDays; units ⊆ UNIT ids and default unit first; months values 1–12 sorted unique or null; avgKg required whenever 'pc' ∈ units; bundleKg/basketKg/sackKg present whenever আঁটি/ঝুড়ি/বস্তা ∈ units; refPricePaisa > 0; source ∈ {DAM-2026-10, estimate}; bn and en names non-empty. Done when: `bun run test:unit -- src/lib/data` green.
10. Property tests (fast-check, S1): taka→paisa→display round-trip stable for 0–2dp inputs; `mulQty` never drifts >1 paisa from exact rational; `kgEquivalentH` strictly increasing in qty for every unit kind; freshness state monotonic in days (never returns to a fresher state); transition() is deterministic and terminal states absorb every event. Done when: properties green with ≥200 runs each.
11. Coverage gates: in `vitest.config.ts` set thresholds for `src/lib/domain/**` to 95% statements and 95% branches (global include-scope gate comes in T19). Done when: `bun run test:unit` prints coverage and passes the gates.
12. Self-review pass (skill `code-review`): Spec then Standards — hunt any float that touched money, any `new Date()` outside clock.ts consumers' parameters.

## Acceptance criteria
1. `bun run test:unit -- src/lib/domain src/lib/data` green; coverage table shows `src/lib/domain` ≥95/95.
2. Story U4 arithmetic verified by `money.test.ts`+`units.test.ts` at S1; U10 transitions by `order-machine.test.ts`; U1 freshness by `freshness.test.ts`; U6 windows by `rate-limit.test.ts`; U8 validation by `validate.test.ts`.
3. `grep -rn "parseFloat\|Number(" src/lib/domain | grep -v test` shows money paths use only integer helpers (no float money arithmetic).
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Hundredths-integer quantities (`qtyH`) are THE domain quantity representation; DB numeric(12,2) maps 1:1 (string ↔ int hundredths helpers live in money.ts).
- Error messages are dictionary keys; domain never imports i18n dictionaries (keys flow out, translation happens in routes/components).
- Keep every module dependency-free of Svelte, DB and fetch — `tsc` should accept them in a bare Node/Bun context.

## Fallbacks
- If a fast-check property fails on a real edge (e.g. half-up vs banker's rounding ambiguity), fix the implementation to half-up per ADR-0002 and keep the property.
- If a taxonomy data error blocks a test, fix the cell in `taxonomy.ts` (you own it) and list every changed cell in the report.

## Hand-off
Report at `.jules/reports/T04.md`. For T08: `pricing.ts` is yours to author under these rules — it may import money/units/clock/data but nothing may import pricing except its consumers. For all feature tasks: validation = `domain/validate` schemas; time = `clock`; every rule you need likely exists here — read the module before writing logic.
