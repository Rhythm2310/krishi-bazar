# T05: Review foundation segment

Wave: 4 | Model: default | Size: M | Mode: review
Branch: `jules/T05-review-foundation` | PR title: `[T05] Review foundation segment`
Skills: code-review, codebase-design
Serves: infrastructure (quality gate) | Seams under test: S1, S2 (audited, not extended)

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
Audit everything the foundation segment merged (T01 scaffold, T02 design shell + i18n, T03 data layer, T04 domain core) on both axes and hand the human a numbered-findings report. You edit no code.

## Context pointers

Fixed point and scope
Fixed point: `origin/main` at session start (all four tasks are merged into it). Scope = the union of owned paths of T01–T04 per `.jules/tasks.csv`, plus the pre-shipped contracts (`src/lib/data/*.ts`, `.github/workflows/ci.yml`, `vercel.json`).

## Owned paths (write)
.jules/reports/T05.md — nothing else.

## Steps
1. Read `.jules/spec.md` (all of it), `GLOSSARY.md`, `docs/adr/0001..0004`, and the four reports `.jules/reports/T0{1,2,3,4}.md`.
2. Spec axis: does the foundation deliver what the spec's Implementation Decisions require? Check specifically: money is integer paisa everywhere (ADR-0002); no Bun-only APIs in `src/**` (ADR-0001); PGlite↔Neon seam works with zero env (ADR-0004); মণ = 40 kg in units; schema covers every spec table/column/enum/index; i18n parity test actually fails on a missing key (mutate a dictionary in a scratch checkout to prove it, do not commit); coverage gates active for `src/lib/domain/**`.
3. Standards axis: AGENTS.md conventions, glossary naming in identifiers/tests, smell baseline and slop checklist (skill `code-review`). Run `python .jules/tools/slop_guard.py --base $(git rev-list --max-parents=0 HEAD)` and include notable output. Check tokens-only styling (no raw hex in components), AA contrast math in tokens, conventional-commit history hygiene.
4. Cross-task pass: duplicated concepts between i18n `format.ts` and domain `money.ts` display helpers; contracts bypassed anywhere; shallow modules (deletion test on `lib/db` adapter and `domain/clock`); CI scripts vs package scripts drift.
5. Write the report; number findings F1, F2… each with the owning task and directory, quoting the source line.

## Acceptance criteria
1. `.jules/reports/T05.md` exists with `## Spec`, `## Standards` and `## Cross-task`, each under 400 words, every finding quoting its source.
2. Every user story U1–U16 appears in the Spec section as covered-so-far, blocked-on-later-task, or as a finding.
3. The last line states findings per axis and the worst finding within each axis, with no single overall winner.
4. `git diff --name-only` shows only `.jules/reports/T05.md`.

## Decision defaults
Judgement-call smells are labelled "possible <smell>". A documented repo standard overrides the baseline. Skip what the linter already enforces.

## Fallbacks
If the fixed point does not resolve, review the cumulative tree of the scope paths and say so in the report.

## Hand-off
The human sends this report to the architect with `REPLAN`. Clean report → the chain continues at T06.
