# T20: Bilingual README, deploy guides and license

Wave: 19 | Model: default | Size: M | Mode: docs
Branch: `jules/T20-docs-readme` | PR title: `[T20] Bilingual README deploy guides and license`
Skills: domain-language, pr
Serves: U15, U16 | Seams under test: n/a (docs task — no code seams; accuracy verified by executing every documented command)

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
A judge (or any engineer) lands on the repo and within five minutes knows what this is, sees it running in screenshots, can start it locally with zero external services, and can deploy it to Vercel + Neon + Blob by following one guide. README.md (English) and README.bn.md (Bangla) mirror each other; screenshots are real captures of the seeded app; LICENSE is MIT.

## Context pointers
- Always: `GLOSSARY.md` (product vocabulary in prose); `.jules/spec.md` (Solution + Further Notes: competition context); `.jules/deps.csv` (version table — cite, never retype from memory).
- `.jules/reports/T17.md` (demo credentials, counts) and `.jules/reports/T19.md` (enforced budgets — state them as guarantees).

## Owned paths (write)
README.md, README.bn.md, docs/screenshots/**, docs/guides/**, LICENSE, .env.example, scripts/screenshots.ts
Also yours: `.jules/reports/T20.md`

## Read-only inputs
everything (docs describe the truth — verify by running)

## Forbidden
- Any path not listed above. Documenting a command without executing it. Placeholders of any kind ("TBD", "coming soon", "your-url-here" as a value — instructional prose like "replace with your project URL" is fine).

## Steps
1. `scripts/screenshots.ts`: Playwright library mode (already a dependency) against the seeded PGlite DB: captures home (bn light), home (en light), home (bn dark), listing detail (bn), create-listing form (bn), farmer orders dashboard (bn), confirmation page (bn), mobile 360px home — 8 PNGs into `docs/screenshots/` with kebab-case names. Deterministic viewport sizes. Done when: `bun scripts/screenshots.ts` regenerates all 8 from a seeded DB.
2. `README.md` (English): title + one-line mission; badge row (CI status badge via the GitHub Actions workflow URL, license, Bun, SvelteKit — real URLs only); screenshot grid (relative `docs/screenshots/*` paths, alt text); **Features** (fair-price advisory with manual override, 9 Bangladesh units incl. মণ/হালি/আঁটি, ~100-category taxonomy, real-world freshness windows with best-before, atomic stock + 24h lazy expiry, verified-buyer comments, bn/en instant toggle, dark mode, WebP pipeline); **Tech** table citing exact versions from `.jules/deps.csv` + runtime note (Bun on Vercel, ADR-0001); **Architecture** (mermaid flowchart of routes→server→domain→data + the PGlite↔Neon seam); **Quick start** (prereq Bun 1.4.3; `bun install --frozen-lockfile`; `bun run db:reset && bun run db:seed`; `bun run dev`; demo credentials from T17); **Scripts** table (every package script, one line each); **Testing** (S1/S2/S3 explanation, gates: domain ≥95/95, include-scope ≥85, Lighthouse budgets enforced); **Deployment** (Vercel Hobby: import repo → it auto-detects SvelteKit; add Neon via Marketplace → `DATABASE_URL`; create Blob store → `BLOB_READ_WRITE_TOKEN`; region bom1 note; `bunVersion` already configured; post-deploy smoke: `/api/health`, register, list, order); **Project story** (built by a sequential Jules agent swarm — 21 tasks, strict profile, 5 review gates; link `.jules/plan.md`); **License** + attribution (quality kit adapted from mattpocock/skills, MIT — see `.agents/skills/NOTICE.md`).
3. `README.bn.md`: full Bangla mirror (same structure, natural Bangla — not word-salad translation; product nouns follow the glossary). Cross-link both READMEs at the top of each (`English | বাংলা`).
4. `LICENSE`: MIT, "Copyright (c) 2026 Krishi Bazar contributors".
5. `.env.example` final pass (you own it now): keep T01's content, add the `PUBLIC`-free truth (only two vars exist), demo-credentials comment pointing at `bun run db:seed` output.
6. `docs/guides/deployment.md`: the expanded deployment guide (Neon free-tier notes incl. scale-to-zero cold start, Blob quota check, branch protection recommendation from `.jules/README.md`'s checklist, env-var table, rollback = redeploy previous Vercel deployment).
7. Accuracy pass: execute every command block in both READMEs and the guide verbatim in a fresh shell; fix any drift. Link check: every relative link resolves (write a 10-line check inside `scripts/screenshots.ts`? — no: a separate throwaway verification run documented in the report; committed scripts stay single-purpose).
8. Self-review pass (skill `pr` mindset): read both READMEs as a first-time judge — is the value obvious in 30 seconds? Are screenshots above the fold?

## Acceptance criteria
1. `bun scripts/screenshots.ts` exits 0 and writes 8 PNGs >10KB each into `docs/screenshots/`.
2. Every fenced command in README.md executes successfully in order from a fresh clone state (list them with their exit status in the report).
3. README.bn.md mirrors every section heading of README.md (assert by diffing heading counts — report the number).
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Screenshots use the T17 seed (season-aware) — do not hand-craft data for them.
- Badge URLs: GitHub Actions workflow badge (`https://github.com/Rhythm2310/krishi-bazar/actions/workflows/ci.yml/badge.svg`) + shields.io static badges for Bun/SvelteKit/license are allowed (static images, no runtime dependency).
- Mermaid renders natively on GitHub — no image export needed.

## Fallbacks
- If a screenshot flow is flaky, capture with `page.screenshot({ animations: 'disabled' })` and a network-idle wait; never ship a broken-image link — regenerate until clean.

## Hand-off
Report at `.jules/reports/T20.md`. For T21: docs accuracy claims are verifiable via the report's command log.
