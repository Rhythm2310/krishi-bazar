# 0004. Neon Postgres in production, PGlite for dev and tests, behind one Drizzle seam

Status: accepted | Date: 2026-10-22

## Context
The owner requires an absolutely free database and Vercel deployment. PocketBase was proposed but
is a self-hosted long-running server and cannot run on Vercel Functions. Neon Postgres (free tier:
$0, 1 GB storage per project, 100 compute-hours/month, scale-to-zero, verified on
neon.com/docs/introduction/plans on 2026-10-22) is the production choice. Tests and local dev
must stay hermetic and zero-setup (U15), and CI must not need Docker services. PGlite 0.5.x is an
embedded WASM Postgres that officially runs on Bun (Apache-2.0) and has a first-party Drizzle
driver.

## Decision
One Drizzle schema is the single contract. A thin adapter chooses the driver from the environment:
`DATABASE_URL` set → Neon serverless HTTP driver; unset → PGlite on a local gitignored directory,
running migrations automatically at first use. All automated tests (S2/S3) run against disposable
PGlite instances. Production and preview deployments set `DATABASE_URL` from the Neon free tier.

## Consequences
`bun install && bun run db:reset && bun run db:seed && bun run dev` works with zero external
services; CI stays Docker-free; test runs are fast and isolated. Costs: PGlite is single-connection
(no concurrency testing against it — the oversell race test uses two concurrent transactions on one
PGlite instance, which still exercises the SQL reservation semantics), and small behavioral drift
between PGlite and Neon is possible — the schema uses only types and SQL both implement, and the
deployment checklist includes a Neon smoke run. Do not add Postgres extensions without checking
PGlite support.
