# 0001. Bun end to end, with a runtime-agnostic escape hatch

Status: accepted | Date: 2026-10-22

## Context
The owner requires Bun for everything and deployment on Vercel (Hobby plan). SvelteKit 3 with
adapter-vercel v7 supports `runtime: 'bun1.x'` for Vercel Functions; Vercel's documentation
currently marks that runtime as beta (VERIFY its status and feature support at build time).
Alternatives considered: stable `nodejs24.x` on Vercel (rejected as the primary by owner
instruction), self-hosting Bun elsewhere (rejected — Vercel is a hard requirement), Node for
tooling and Bun only in development (rejected — splits the toolchain).

## Decision
Bun is the single toolchain: package manager (`bun.lock`), dev server, test runner, build, and
the production runtime on Vercel (`runtime: 'bun1.x'`). Application code under `src/` stays
runtime-agnostic — web-standard APIs (fetch, Request/Response, Web Crypto where possible) and
`node:crypto` (which Bun implements) instead of Bun-only APIs such as `Bun.password`, `Bun.serve`
or `bun:sqlite` inside `src/`. Bun-only APIs are permitted in dev scripts (`scripts/`, seeding,
tooling) that never ship to Vercel.

## Consequences
One tool, one lockfile, fast installs and tests everywhere; local `bun run dev` matches the
production runtime family. The beta-runtime risk is contained: because `src/` avoids Bun-only
APIs, switching to `nodejs24.x` is a one-line adapter config change with no code edits. Do not
add Bun-only APIs to `src/` casually — that silently removes the escape hatch.
