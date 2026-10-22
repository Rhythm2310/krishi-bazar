# T17: Season-aware seed data and local DX

Wave: 16 | Model: default | Size: M | Mode: feature
Branch: `jules/T17-seed-dx` | PR title: `[T17] Season-aware seed data and local DX`
Skills: domain-language, tdd, code-review, pr
Serves: U15 | Seams under test: S1, S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
`bun run db:reset && bun run db:seed` fills the local PGlite database with a marketplace that looks like Bangladesh **this month**: two demo Farmers with documented credentials, ~14 Listings drawn from in-season and year-round Categories only (ইলিশ in আশ্বিন, no আম in October), orders across every lifecycle state incl. one ready to auto-expire, comments with a Verified-buyer match and a farmer reply, and one paused + one deleted listing for the manage page. Seeding is idempotent and refuses to run against a real database.

## Context pointers
- Always: `GLOSSARY.md`; `.jules/spec.md` U15 + Further Notes (season realism is a judging criterion).
- Contracts: `src/lib/data/taxonomy.ts` (months, windows, prices), `src/lib/db/schema.ts`, `src/lib/server/auth/password.ts` (hash demo passwords with the real hasher), `.jules/reports/T13.md` (expiry backdating), `.jules/reports/T16.md` (paused/deleted demo states).

## Owned paths (write)
scripts/db/seed.ts, src/lib/data/seed/**
Also yours: `.jules/reports/T17.md`

## Read-only inputs
src/lib/db/**, src/lib/data/{taxonomy,rates,districts}.ts, src/lib/domain/**, src/lib/server/auth/password.ts

## Forbidden
- Any path not listed above. Seeding when `DATABASE_URL` is set (hard refusal). Photos in seed data (listings use the placeholder — no binary assets). Committed secrets beyond the documented demo credentials (they are fake by design and printed on every seed run).

## Steps
1. `src/lib/data/seed/plan.ts` (Slice, U15, S1, red first): pure seed planner — `planSeed(month: number)` → deterministic plan: choose ~14 categories = all with `months === null` up to 6, plus in-season (`months.includes(month)`) filling the rest; NEVER an out-of-season seasonal category; per listing derive qty (2–80 by unit kind), price = refPricePaisa ± deterministic 10% spread (seeded LCG, no `Math.random`), grade round-robin, organic every 3rd, harvest dates spread 0–4 days inside each category's prime window (fish/dairy: today only), districts round-robin over 10 real districts, villages from a fixed realistic list (শিবগঞ্জ, বগুড়া / চৌমুহনী, নোয়াখালী / বাজিতপুর, কিশোরগঞ্জ …). Tests: October plan contains ilish, excludes am/lichu; January plan contains khejur-gur, excludes ilish (months [9,10,11,2,3] — January=1 not included → excluded; assert); determinism (same month twice → identical plan); no plan ever contains an out-of-season seasonal.
2. `src/lib/data/seed/orders.ts` + `comments.ts` (pure fixtures): order set covering statuses new / accepted / in_transit / delivered / cancelled(stock_out) / one `new` with `created_at` = now−25h and `expires_at` = now−1h (expiry demo — the lazy sweep cancels it on first dashboard read); buyer phones realistic (`017…`/`018…`); comment set: 2 listings × 2 comments, one comment's `author_phone` equals the delivered order's buyer phone (Verified-buyer demo), one farmer reply on another. Tests: fixtures satisfy every schema constraint (run them through the same zod schemas the app uses).
3. `scripts/db/seed.ts` (Slice, U15, S2): refuses with a clear message when `DATABASE_URL` is set; PGlite mode only; idempotent — wipes tables in FK order then inserts the plan; creates farmers via the real `hashPassword`; writes sessions? no (demo login is via password); prints the demo credentials table + counts at the end. Tests via `withTestDb`: seed once → exact counts (farmers 2, listings 14, orders 6, comments ≥5, replies 1); seed twice → identical counts (idempotence); the expired order is present with past `expires_at`; verified-match pair exists (query the same EXISTS the badge uses).
4. Wire the `db:seed` package script entry (T01 created it pointing at `scripts/db/seed.ts` — verify the path matches; if it doesn't, file a request rather than editing package.json).
5. Self-review pass (skill `code-review`): Spec then Standards — determinism (no wall-clock beyond the injected month/now, no randomness), glossary names in fixtures, no PII-looking real numbers (01711…/01822… patterns are documented fakes).

## Acceptance criteria
1. `bun run db:reset && bun run db:seed && bun run db:seed` exits 0 twice with identical printed counts.
2. Story U15 verified by `src/lib/data/seed/seed.test.ts` at S1/S2 (planner season rules + idempotence + expired-order + verified-pair).
3. `DATABASE_URL=postgres://fake bun run db:seed` exits non-zero with the refusal message (assert in a test via spawn or extracted guard function).
4. `bun run dev` after seeding shows a populated, seasonally plausible marketplace (asserted in e2e? — no: manual dev check + the counts test; e2e suite stays self-seeded).
5. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Demo credentials: `01711111111` / `Krishi@1234` (farmer one, Bogura), `01822222222` / `Krishi@5678` (farmer two, Narsingdi) — printed by the script and documented by T20's README.
- Month/now are parameters (`planSeed(month, now)`) — the script passes the real Dhaka month via `clock.todayDhaka()`.
- Seed prices spread deterministically around refPricePaisa so Fair-price advice visibly differs per listing.

## Fallbacks
- If table wipe order hits FK cycles, use `TRUNCATE ... CASCADE` (both drivers support it) and note it.

## Hand-off
Report at `.jules/reports/T17.md`. For T19/T20: dev-mode demo data + credentials are the judging path; screenshots should be taken against a seeded DB.
