# T01: Scaffold toolchain CI and tracer skeleton

Wave: 0 | Model: default | Size: L | Mode: foundation
Branch: `jules/T01-scaffold-toolchain` | PR title: `[T01] Scaffold toolchain CI and tracer skeleton`
Skills: domain-language, tdd, codebase-design, code-review, pr
Serves: infrastructure (enables U14, U16) | Seams under test: S3

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
A fresh clone becomes a working, verified SvelteKit 3 app on Bun with one command. After this task: `bun install --frozen-lockfile && bun run verify` is green, `/api/health` answers JSON, the pre-shipped CI workflow matches the package scripts exactly, and the whole plan's dependency set is installed at the versions pinned in `.jules/deps.csv`.

## Context pointers
- Always: `GLOSSARY.md`; `.jules/spec.md` (Testing Decisions, Further Notes); `.jules/deps.csv` (every version you install).
- ADRs: `docs/adr/0001-bun-runtime.md` (runtime-agnostic rule), `0002-money-integer-paisa.md`, `0003-sequential-execution.md`, `0004-neon-pglite-seam.md`.
- Pre-shipped files you must not rewrite, only align with: `.github/workflows/ci.yml`, `vercel.json`, `.env.example`, `src/lib/data/taxonomy.ts`, `src/lib/data/districts.ts`.

## Owned paths (write)
package.json, bun.lock, tsconfig.json, svelte.config.js, vite.config.ts, vitest.config.ts, playwright.config.ts, eslint.config.js, .prettierrc.json, .prettierignore, commitlint.config.js, .gitignore, .env.example, vercel.json, .github/workflows/**, src/app.html, src/app.d.ts, src/hooks.server.ts, src/routes/api/health/**, src/routes/+page.svelte, src/lib/test/**, static/**, scripts/lighthouse/**, e2e/smoke.spec.ts
Also yours: `.jules/reports/T01.md`

## Read-only inputs
`.jules/deps.csv`, `src/lib/data/*.ts`, `AGENTS.md`, `GLOSSARY.md`, `.jules/spec.md`

## Forbidden
- Any path not listed under Owned paths.
- New dependencies or version changes beyond `.jules/deps.csv` — you install exactly that ledger (you are the only task allowed to).
- Weakening any CI job that ships pre-written.

## Steps
1. Scaffold SvelteKit 3 (Svelte 5, TS strict) with Bun. `package.json`: `"engines": {"bun": ">=1.4.3"}`; scripts exactly: `dev`, `build`, `preview`, `check` (svelte-check --tsconfig ./tsconfig.json), `lint` (eslint .), `format` (prettier --check .), `test:unit` (vitest run --coverage), `test:e2e` (playwright test), `verify` (check && lint && format && test:unit && test:e2e && build), `db:generate` (drizzle-kit generate), `db:migrate`, `db:reset`, `db:seed` (last three point at scripts/db/* files that T03/T17 create — define the script entries now; until the files exist they print a clear not-yet-available message and exit 1), `lh` (bun scripts/lighthouse/check.ts). Install every deps.csv npm row at its exact version (runtime deps vs devDeps by role). Commit `bun.lock`. Done when: `bun install --frozen-lockfile` succeeds from clean.
2. Wiring per pinned versions: vite.config.ts uses the SvelteKit 3 plugin form with adapter-vercel 7 (`runtime: 'bun1.x'`, `regions: ['bom1']`) — follow the adapter-vercel 7.0.0 docs for exact placement. tsconfig strict + `moduleResolution: bundler` per SvelteKit defaults. Done when: `bun run build` produces `.vercel/output`.
3. Tooling configs: eslint flat config (js recommended, typescript-eslint recommended, eslint-plugin-svelte flat/recommended + flat/prettier, eslint-config-prettier last); prettier with prettier-plugin-svelte; commitlint extends @commitlint/config-conventional; .gitignore includes `.data/`, `.lighthouse/`, `node_modules`, `.svelte-kit`, `build`, `coverage`, `test-results`, `playwright-report`, `.env`. Done when: `bun run lint && bun run format` pass on the scaffold.
4. `src/app.html`: `<html lang="bn">`, meta charset/viewport, theme-color, an inline pre-paint script that reads the `kb_theme` cookie (`light|dark`) and sets `data-theme` on `<html>` before render (prevents theme flash; T02 owns the toggle that writes the cookie). Done when: reloading with cookie `kb_theme=dark` shows `data-theme="dark"` before paint.
5. `src/hooks.server.ts`: `handle` adds security headers to every response (Content-Security-Policy: `default-src 'self'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'` — the inline theme script needs `'unsafe-inline'` in script-src for now, T19 hardens with nonces; X-Content-Type-Options nosniff; Referrer-Policy strict-origin-when-cross-origin; X-Frame-Options DENY; Permissions-Policy `camera=(), microphone=(), geolocation=()`), reads the `kb_locale` cookie into `event.locals.locale` (default `'bn'`), and extends `App.Locals` in `src/app.d.ts` (`locale: 'bn' | 'en'`; `farmer?: { id: string; phone: string } | null` — T06 fills it). Done when: `curl -sI` on preview shows all five headers.
6. Tracer skeleton: `src/routes/api/health/+server.ts` GET → `Response.json({ status: 'ok' })`; `src/routes/+page.svelte` minimal brand page (renders "কৃষি বাজার" — T02 replaces it; keep it honest and styled with plain CSS, no placeholder copy like "coming soon"). `static/`: favicon.svg (simple wheat/green mark you draw as inline SVG), placeholder.webp (a small solid-color valid WebP used for listings without photos — generate it once with a throwaway script, commit the binary; do not commit the script outside owned paths). Done when: health returns JSON 200 in preview.
7. Test harness: vitest.config.ts (environment node, coverage provider v8, `coverage.include: ['src/lib/**']`, no thresholds yet — T04 adds them); playwright.config.ts (chromium project, `webServer: { command: 'bun run build && bun run preview --port 4173', reuseExistingServer: !process.env.CI }`, baseURL http://localhost:4173, trace on-first-retry); `src/lib/test/utils.ts` (tiny helpers later tasks reuse: `makeRequest` wrappers — keep minimal, only what smoke needs); `e2e/smoke.spec.ts` (Slice 1, S3, red first: home loads and shows the brand; `/api/health` JSON ok; security header present). Done when: `bun run verify` exits 0.
8. `scripts/lighthouse/check.ts`: spawns `bun run preview --port 4173`, runs the pinned `lighthouse` CLI (chrome flags headless) against `/` (mobile form factor), writes JSON to `.lighthouse/`, compares scores to `scripts/lighthouse/budgets.json` (`{"performance":90,"accessibility":95,"best-practices":95,"seo":95}`); **failing budgets only fail the process when the file `scripts/lighthouse/enforce` exists** (T19 creates it); without it, print the scores and exit 0. Done when: `bun run lh` prints scores and exits 0.
9. CI alignment: the pre-shipped `.github/workflows/ci.yml` references `bun run check/lint/format/test:unit/test:e2e/build/lh` and `bunx --bun commitlint` — make every referenced script exist with exactly that name. Do not restructure the workflow. Done when: every `run:` command in ci.yml resolves to a package script or committed file.
10. Self-review pass (skill `code-review`): Spec axis against this file and AGENTS.md sections 3–5, then Standards.

## Acceptance criteria
1. `bun install --frozen-lockfile && bun run verify` exits 0 on a fresh clone.
2. `bun run build` succeeds and produces Vercel output configured for the Bun runtime (`runtime: 'bun1.x'`, region `bom1` visible in build output config).
3. Smoke S3: `bunx playwright test e2e/smoke.spec.ts` green (home, health, header).
4. `curl -sI http://localhost:4173/ | grep -i content-security-policy` shows the CSP.
5. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Versions come only from `.jules/deps.csv`; if `bun install` resolves a transitive conflict, adjust the lockfile by reinstalling — never change a pinned direct version.
- Runtime-agnostic rule (ADR-0001): no `Bun.*` APIs in `src/**`; scripts/ may use them.
- Keep configuration files minimal and commented only where a choice is surprising.
- The brand mark is a simple inline SVG; no image dependencies, no external fonts yet (T02 wires fontsource).

## Fallbacks
- If adapter-vercel 7 rejects `runtime: 'bun1.x'` in its current docs shape, configure the closest documented equivalent (`vercel.json` `bunVersion: "1.4.x"` is already shipped) and record the deviation in the report.
- If Playwright browser download fails in your VM, retry once with `bunx playwright install chromium --with-deps`; if still failing, mark the e2e criterion `[PARTIAL]` and note it — unit-level criteria still must pass.

## Hand-off
Report at `.jules/reports/T01.md`. For T02: the theme cookie name is `kb_theme`, locale cookie `kb_locale`, `locals.locale` exists; `src/routes/+page.svelte` and `static/placeholder.webp` are yours to replace/consume. For T03: `db:*` script entries exist and expect `scripts/db/{migrate,reset,seed}.ts`. For T04: vitest coverage include is `src/lib/**` with no thresholds. For everyone: `bun run verify` is the gate.
