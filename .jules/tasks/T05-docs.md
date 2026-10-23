# T05: README and Vercel deployment guide

Wave: 1 | Model: gemini pro 15 | Size: S | Mode: docs
Branch: `jules/T05-docs` | PR title: `[T05] README and Vercel deployment guide`
Skills: domain-language; pr
Serves: U9 (README half) | Seams under test: n/a: docs-only task; no runtime behaviour

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

A visitor of the GitHub repo understands in one minute what the UIU Calculator does, what data it trusts (EffectiveDate, official sources), what it explicitly is not, and how to run it; an owner can deploy it to Vercel by following `docs/deployment.md` once, without guessing.

## Context pointers

- Always: `GLOSSARY.md` (use its words); `.jules/spec.md` — Solution, User Stories U1–U9, Out of Scope, Further Notes (sources + VERIFY items).
- Read-only facts: `src/lib/domain/data/fee-rules.ts` and `programs.ts` (EffectiveDate, source URLs, disclaimer text — quote them exactly), `package.json` (script names), `docs/adr/0001…`, `docs/adr/0002…`.

## Owned paths (write)

```
README.md
docs/deployment.md
```
Also yours: `.jules/reports/T05.md`

## Read-only inputs

Everything else. This task changes no code and no config.

## Forbidden

- Any path outside the two owned files. No edits to spec, data, package.json or CI (AGENTS.md 5.2/5.3/5.10).
- Inventing facts: every number, date and URL in the docs comes from the data modules or the spec — never from memory or the web.
- Documenting features the spec lists as Out of Scope as if they existed.

## Steps

Mechanical task — write exactly these two files with exactly these sections.

1. `README.md`, in this order:
   1. `# UIU Calculator` + one-paragraph description (Term planner for United International University undergraduates: TermGpa, Cgpa with Retake replacement, itemized FeeBreakdown in Taka, official PaymentSchedule; static web app, no accounts).
   2. **Live demo** — one line: deployed on Vercel; the URL is filled in by the owner after the first deploy (write `_(add your Vercel URL here after deploying — see docs/deployment.md)_`).
   3. **Features** — a bullet per story U1–U9 in plain Student language, glossary words capitalized (Planner, SavedTerm, FeeBreakdown, PaymentSchedule, WaiverTier, FirstTerm, Retake).
   4. **Data and disclaimer** — required content: `Data effective: 2026-10-23` (the EFFECTIVE_DATE value); links to both official source URLs (grading + fees) exactly as stored in the data module; the DISCLAIMER sentence verbatim; the WaiverTier estimate caveat (published 25%/50% totals do not reproduce from the public formula — computed waiver amounts are estimates, conditions apply); the Retake note (latest attempt replaces the earlier one in Cgpa — an assumption to verify against UIU regulations, see ADR 0002); CautionMoney is refundable, AdmissionFee is not; graduate Programs are not covered yet.
   5. **Run it locally** — Node.js 24 (the version pinned in `.jules/deps.csv`), `npm ci`, `npm run dev`, `npm run verify` (what it runs, one line), `npx playwright install --with-deps chromium` before the first e2e run.
   6. **Deploy** — one line pointing to `docs/deployment.md`.
   7. **Project layout** — the short architecture summary (domain modules behind a frozen contract; seams S1/S2; pointer to `.jules/plan.md` and `AGENTS.md` for the swarm workflow).
2. `docs/deployment.md`, in this order:
   1. Prerequisites: the repo pushed to GitHub with T01 merged (a committed `package-lock.json`), a Vercel account, GitHub App permission for the repo.
   2. Connect once: Vercel dashboard → Add New… → Project → import `Rhythm2310/uiu-calculator` → framework preset auto-detects SvelteKit → keep default build command `npm run build` and the adapter-vercel output → **no environment variables exist; add none** → Deploy.
   3. Ongoing: every merge to `main` deploys production; PRs get preview deployments (branch protection keeps `main` green first).
   4. Runtime note: the app prerenders to static output; any Vercel functions run on the Node 24 line — confirm the runtime label shown in the Vercel dashboard (VERIFY item in `.jules/plan.md`).
   5. Smoke test after deploy: open the URL, add a Course (3 Credits, grade A) → TermGpa `4.00`; footer shows `Data effective: 2026-10-23`; save a Term, reload, it persists.
   6. Troubleshooting: build fails on `npm ci` → lockfile out of sync (foundation owns it — file a request, do not hand-edit); blank page → check the browser console and that prerendering succeeded (`npm run build` locally first).
3. Consistency pass: every command you wrote exists verbatim in `package.json` scripts or AGENTS.md section 3; every number matches the data modules; glossary words are used exactly.

## Acceptance criteria

1. `grep -c "2026-10-23" README.md` prints at least 1 and `grep -c "verify with UIU before paying" README.md` prints at least 1 (case-insensitive match on the DISCLAIMER wording as stored in the data module).
2. `grep -c "uiu.ac.bd" README.md` prints at least 2 (both official source URLs).
3. Every `npm run …` string in both files appears verbatim in `package.json` (`grep -o "npm run [a-z:-]*" README.md docs/deployment.md` then compare).
4. `npm run verify` exits 0 (unchanged by this task — proves no drive-by edits) and `python .jules/tools/slop_guard.py --strict` reports no ERROR.
5. `git diff --name-only origin/main...HEAD` lists only `README.md`, `docs/deployment.md`, `.jules/reports/T05.md`.

## Decision defaults

- Tone: plain, factual, second person for instructions. No badges, no screenshots (the UI may still be changing until T04 merges).
- Heading levels: one `h1` per file; sections as `h2`.
- Where the spec and a data module disagree (they should not): the data module wins for values; note the disagreement in your report.

## Fallbacks

- If `package.json` does not exist yet (T01 not merged when you run — should not happen, waves gate it): stop, report `[PARTIAL]`, list the missing prerequisite.
- If a required fact is missing from the repo (e.g. a source URL): cite `.jules/spec.md` Further Notes; never fetch from the web.

## Hand-off

Report at `.jules/reports/T05.md`. Tell T06: which README lines carry the U9 obligations (EffectiveDate, sources, disclaimer) so the review can check them against the data modules.
