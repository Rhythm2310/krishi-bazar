# T03: Data layer schema and PGlite-Neon adapter

Wave: 2 | Model: default | Size: M | Mode: foundation
Branch: `jules/T03-data-layer` | PR title: `[T03] Data layer schema and PGlite-Neon adapter`
Skills: domain-language, tdd, codebase-design, code-review, pr
Serves: infrastructure (enables U15, U16) | Seams under test: S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
The whole database exists as one frozen Drizzle contract, with a single adapter seam that runs on embedded PGlite when `DATABASE_URL` is unset (dev, tests, CI — zero external services) and on Neon Postgres serverless HTTP when it is set (production). Migrations are generated, committed, and applied automatically in PGlite mode.

## Context pointers
- Always: `GLOSSARY.md`; `.jules/spec.md` (Implementation Decisions: Database, Orders lifecycle, Comments, Auth) and `docs/adr/0004-neon-pglite-seam.md`.
- `src/lib/data/districts.ts` and `src/lib/data/taxonomy.ts` are shipped contracts — the schema references their ids as text, never as foreign keys.

## Owned paths (write)
src/lib/db/**, drizzle/**, drizzle.config.ts, scripts/db/**, src/lib/data/districts.ts
Also yours: `.jules/reports/T03.md`

## Read-only inputs
src/lib/data/taxonomy.ts, src/lib/test/**, package.json (drizzle + neon + pglite installed)

## Forbidden
- Any path not listed above. Editing `taxonomy.ts` (request via 5.7 if it blocks you).
- Postgres extensions or features PGlite lacks — both drivers must run the identical SQL.

## Steps
1. `src/lib/db/schema.ts` — the frozen contract. Drizzle pgTable definitions with pgEnum types, glossary-named columns:
   - Enums: `unit_enum` (kg, pc, hali, dozen, aati, jhuri, bosta, litre, maund); `grade_enum` (premium, grade_1, grade_2); `listing_status` (active, paused, deleted); `order_status` (new, accepted, in_transit, delivered, cancelled); `reject_reason` (stock_out, wrong_price, other, expired); `speed_enum` (express, standard).
   - `farmers`: id uuid pk (app-generated), phone text unique not null (normalized `01XXXXXXXXX`), password_hash text not null, created_at timestamptz not null default now.
   - `sessions`: id text pk (sha256 hex of the session token — raw tokens are never stored), farmer_id uuid not null references farmers on delete cascade, expires_at timestamptz not null, created_at timestamptz not null default now.
   - `listings`: id uuid pk, farmer_id uuid not null ref, category_id text not null, name text not null, unit unit_enum not null, qty numeric(12,2) not null check ≥ 0, price_paisa integer not null check > 0, grade grade_enum not null, organic boolean not null default false, harvest_date date not null, district_id text not null, village text not null, description text not null default '', photos text[] not null default '{}' (app-enforces ≤3), status listing_status not null default 'active', created_at timestamptz not null default now.
   - `orders`: id uuid pk, listing_id uuid not null ref, buyer_name text not null, buyer_phone text not null, address text not null, qty numeric(12,2) not null check > 0, speed speed_enum not null, goods_paisa integer not null, delivery_paisa integer not null, total_paisa integer not null check = goods+delivery is app-enforced, status order_status not null default 'new', reject_reason reject_reason, cancel_token text not null, expires_at timestamptz not null, created_at / updated_at timestamptz not null default now.
   - `comments`: id uuid pk, listing_id uuid not null ref, farmer_id uuid ref (set only on farmer replies), parent_id uuid ref comments (top-level null), author_name text not null, author_phone text (optional — powers Verified buyer), body text not null, ip_hash text not null, created_at timestamptz not null default now; **unique partial index on parent_id where parent_id is not null and farmer_id is not null** (one farmer reply per comment).
   - `ip_events`: id bigserial pk, ip_hash text not null, kind text not null (auth|order|comment|upload), created_at timestamptz not null default now; index (ip_hash, kind, created_at).
   - Indexes: listings (status, harvest_date desc), listings(category_id), listings(district_id), listings(farmer_id), orders(listing_id), orders(status, expires_at), orders(buyer_phone), comments(listing_id, created_at desc).
   Done when: `bun run db:generate` emits migration SQL covering every table/index above and `drizzle/` is committed.
2. `src/lib/db/index.ts` — the adapter seam: `getDb()` returns a Drizzle client; `process.env.DATABASE_URL` set → `drizzle-orm/neon-http` with `@neondatabase/serverless`; unset → `drizzle-orm/pglite` on `.data/pglite` running committed migrations automatically at first use (async init helper `initDb()`; document that PGlite mode needs one `await initDb()` before queries — expose `db` as a lazy proxy so call sites stay sync). `src/lib/db/testing.ts`: `withTestDb(fn)` — fresh in-memory/temp-dir PGlite per suite, migrated, torn down after. Done when: a round-trip insert/select works in PGlite mode via a test.
3. `scripts/db/migrate.ts` (requires DATABASE_URL; applies committed migrations to Neon via drizzle-orm/neon-http migrator; prints each applied migration), `scripts/db/reset.ts` (PGlite-only: deletes `.data/pglite` and re-initializes; refuses with a clear message when DATABASE_URL is set), `scripts/db/smoke.ts` (optional human-run Neon check: connect, `select 1`, print latency). Wire to the `db:*` package script entries T01 created (scripts live in your paths; package.json entries already point here — if a path differs, file a request rather than editing package.json). Done when: `bun run db:reset` then `bun run db:migrate` on PGlite (DATABASE_URL unset → migrate is a no-op message; reset+auto-init leaves a migrated DB).
4. Tests (Slice per behaviour, S2, red first, via `withTestDb`): migrations apply to a fresh DB; every table round-trips a row; farmers.phone unique violation surfaces; listings qty check rejects negative; orders total check constraint; comments single-farmer-reply unique partial index rejects a second reply; `getDb()` returns neon client shape when DATABASE_URL is set (inject a fake URL, assert driver type — no network call). Done when: `bun run test:unit -- src/lib/db` green.
5. Self-review pass (skill `code-review`): Spec (every spec schema decision present) then Standards (glossary names, no floats for money columns, timestamptz everywhere).

## Acceptance criteria
1. `bun run db:reset && bun run test:unit -- src/lib/db` exits 0 with zero external services.
2. `drizzle/` contains committed SQL migrations; `git diff --stat drizzle/` after a second `db:generate` is empty (schema and migrations in sync).
3. Story U15 verified by test `src/lib/db/adapter.test.ts` at seam S2 (PGlite mode auto-migrates).
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- UUIDs generated app-side with `crypto.randomUUID()` (runtime-agnostic, ADR-0001).
- All money columns integer paisa; all quantities numeric(12,2) in the Listing's unit; all timestamps timestamptz (UTC storage; Dhaka conversion is domain code, T04).
- English enum values in the DB; Bangla labels are i18n dictionary entries, never stored.
- `photos` is a text array of storage URLs; no separate table.

## Fallbacks
- If PGlite's migrator path resolution misbehaves inside the Vite build, import migrations via `import.meta.glob('../drizzle/**/*.sql', { eager: true, query: '?raw' })` and apply them in filename order — same guarantee, note it in the report.
- If the neon-http import breaks `bun run test:unit` (it must not be loaded in PGlite mode), make the neon branch a dynamic `await import()` inside `getDb()`.

## Hand-off
Report at `.jules/reports/T03.md`. For T04 and all server tasks: import `db`/`initDb`/`withTestDb` from `$lib/db`; the schema is frozen — wrong column = request (5.7), not edit. For T17: `scripts/db/seed.ts` slot is yours; reset exists.
