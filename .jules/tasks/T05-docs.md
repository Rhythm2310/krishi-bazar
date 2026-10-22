# T05: README and Vercel deployment guide

Wave: 2 | Model: gemini pro 15 | Size: S | Mode: docs
Branch: `jules/T05-docs` | PR title: `[T05] README and Vercel deployment guide`
Skills: domain-language; pr
Serves: U9 | Seams under test: n/a: documentation only, no code paths

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

When this is merged, a visitor of the repository understands in under two minutes what the app does, that every number is an estimate tied to an EffectiveDate with official sources, how to run and verify it locally, and how a human deploys it to Vercel — without reading any task file or spec.

## Context pointers

Read these when the condition holds; each is a path, not a copy.
- Always: `GLOSSARY.md` (use its words in every heading and sentence); `.jules/spec.md` (stories U1–U9, Out of Scope, Further Notes — the README's claims must match it exactly).
- When writing the fee/grading sections: `src/lib/domain/data/fee-rules.ts` and `src/lib/domain/data/programs.ts` (quote EffectiveDate, source URLs, the Program table and constants from these files — never from memory).
- When writing the development section: `package.json` (script names) and `.jules/deps.csv` (Node 24 / npm versions).
- When writing the deployment guide: `.jules/plan.md` (Vercel decisions, base-branch flow).

## Owned paths (write)

```
README.md
docs/deployment.md
```

Also yours: `.jules/reports/T05.md`

## Read-only inputs

Everything else. In particular `docs/adr/**` (reference ADR 0001 by link; never edit it) and `.jules/**` (link, never edit).

## Forbidden

- Any path not listed under Owned paths. `docs/adr/**` is architect-owned — your new file is `docs/deployment.md` only.
- New dependencies, code changes, CI changes. This task writes documentation only.
- Inventing numbers: every Taka amount, date, version and URL in the docs is quoted from the read-only inputs listed above.

## Steps

Mechanical task: write the two files with exactly the sections below, in this order.

1. `README.md`:
   - Title `UIU Calculator` + one-line description (Cgpa and tuition + registration planner for United International University Students).
   - **Disclaimer block, directly under the title** (U9): estimates only; data effective `2026-10-23` (quote `FEE_RULES.effectiveDate`); links to both official source URLs from `fee-rules.ts`; the sentence `UIU may change fees without notice — verify amounts with UIU before paying.`; a note that WaiverTier results are estimates because official waiver totals follow conditions not fully published.
   - **What it does**: one bullet per capability, mapped from U1–U8 in glossary words (Planner, TermGpa, SavedTerms, Cgpa with the 2.00 degree requirement, FeeBreakdown, FirstTerm charges with refundable CautionMoney, WaiverTier, PaymentSchedule).
   - **Programs covered**: the 12-Program table transcribed from `programs.ts` (name, total Credits, PerCreditFee, TermSystem, LabFeePerTerm).
   - **How the math works**: short prose — credit-weighted TermGpa/Cgpa; the official grade table (transcribe all 11 LetterGrades from `grading-scale.ts`); the fee formula (tuition = Credits × PerCreditFee; TermFee; LabFee; FirstTerm one-time charges; RetakeWaiver 50% first-time; tierWaiver on non-Retake tuition); the PaymentSchedule (Tk 20,000 PreRegistrationPayment then 40/30/30 or 4×25%); the Retake replacement rule with the note that UIU has not published it explicitly and it is an assumption.
   - **Privacy**: SavedTerms live in the browser's localStorage only (link `docs/adr/0001-localstorage-only-state.md`); clearing site data erases them; nothing is sent anywhere.
   - **Development**: requires Node 24 (quote the exact CI pin `24.22.1` from `.jules/deps.csv`); `npm ci`; `npm run dev`; `npm run verify` (what it runs, from `package.json`); single-test commands (`npx vitest run <file>`, `npx playwright test <file>`); project structure summary (domain modules / components / stores / format / tests-e2e) and the two seams S1/S2 in one sentence each.
   - **Deployment**: one line + link to `docs/deployment.md`.
   - **Swarm operations**: one line — this repo is built by a Jules swarm; the loop lives in `.jules/README.md`.
2. `docs/deployment.md` (human-run guide; no agent deploys):
   - Prerequisites: Vercel account, GitHub repo `Rhythm2310/uiu-calculator` connected, all waves merged and `integration/uiu-calculator` merged into `main`.
   - Steps: Vercel Dashboard → Add New → Project → import the repo; Framework Preset: SvelteKit (auto-detected); Build Command: leave default (`vite build` via adapter-vercel); no environment variables exist — add none; Node.js version: select 24.x if the dashboard offers a choice (VERIFY the exact label in the dashboard; note it in the report); Deploy.
   - Production branch: `main`. The swarm's integration branch is not deployed.
   - After deploy: open the production URL, check the footer shows the EffectiveDate and disclaimer (U9), run one sample calculation (BSCSE, 15 credits, FirstTerm, tier 0 → total `Tk 1,26,000`).
   - Redeploys: every merge to `main` redeploys automatically; fee-data updates happen through a swarm amendment task, then this flow again.
3. Format check: run `npx prettier --check README.md docs/deployment.md`; if it fails, run `npx prettier --write` on those two files only. Done when the check exits 0.
4. Self-review pass (skill `code-review` applies to docs as Spec axis): every claim in the README traces to spec, data files or plan; every number quoted, none remembered; glossary words used consistently (Term not "semester" generically; TermGpa/Cgpa not bare "GPA"). Fix findings before the PR.

## Acceptance criteria

Each line is checkable by a command.
1. `test -f README.md && test -f docs/deployment.md` exits 0.
2. `grep -c "2026-10-23" README.md` prints at least 1 and `grep -c "verify amounts with UIU before paying" README.md` prints 1 (U9).
3. `grep -c "^| " README.md` prints at least 14 (the 12-Program table plus the grade table rows are present as tables).
4. `npx prettier --check README.md docs/deployment.md` exits 0.
5. `npm run verify` passes (docs must not break lint) and `python .jules/tools/slop_guard.py --strict` reports no ERROR and no WARN.
6. `git diff --name-only origin/integration/uiu-calculator...HEAD` shows only `README.md`, `docs/deployment.md` and `.jules/reports/T05.md`.

## Decision defaults

- English only; Taka amounts written `Tk 1,26,000` (en-IN grouping, as the app displays them).
- Headings and terms exactly as in GLOSSARY.md; link ADR and spec by relative path.
- Keep README under ~200 lines; deeper detail belongs in `docs/deployment.md` or linked files, not duplicated.
- Do not document UI screens that T04 might still shape: describe capabilities, not layouts.

## Fallbacks

- If T04's report reveals a capability changed (e.g. different testids or an extra panel): document the capability as the spec states it — the spec is authoritative over implementation detail; note any mismatch in your report for T06.
- If a data file disagrees with the spec's numbers: the data files are the frozen official table — quote them and flag the discrepancy in your report; never edit them.

## Hand-off

Report at `.jules/reports/T05.md` (format in AGENTS.md section 10). Tell T06 (review): which README claims map to which spec stories, and any spec/data discrepancy you flagged.
