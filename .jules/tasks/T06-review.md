# T06: Review the merged codebase (strict)

Wave: 3 | Model: gemini pro 15 | Size: M | Mode: review
Branch: `jules/T06-review` | PR title: `[T06] Strict review of merged codebase`
Skills: code-review; codebase-design

Read `/AGENTS.md` first. This task changes no code.

## Objective

Review everything merged since the fixed point along two axes, Spec and Standards, and report findings. A separate fix wave acts on them. This is the strict-profile review after the single integration point.

## Context pointers

- Fixed point: `origin/main` (the pack commit; the integration branch diverged from it). Diff: `git diff origin/main...HEAD`.
- Spec: `.jules/spec.md` (user stories U1..U9, seams S1, S2). Glossary: `GLOSSARY.md`. ADRs: `docs/adr/`.
- Task reports: `.jules/reports/T01.md`, `T02.md`, `T03.md`, `T04.md`, `T05.md` — including every `[PARTIAL]`, leftover and request noted there.
- Plan and traceability: `.jules/plan.md`.

## Owned paths (write)

`.jules/reports/T06.md`

## Steps

1. Pin the fixed point and capture the diff and commit list. An empty or unresolvable diff: stop and report `[PARTIAL]`.
2. Spec pass: for every story U1..U9, find the code and the test that delivers it (S1 tests in `src/lib/domain/**/*.test.ts`, S2 flows in `tests/e2e/**`). List stories missing or partial, behaviour nobody asked for, and implementations that look wrong — especially: the Retake replacement rule (U2), the FeeBreakdown formula order and golden Taka values (U5–U8), the FirstTerm no-double-charge note (U6, U8), and the EffectiveDate/disclaimer presence in the UI footer and README (U9). Quote the spec line per finding.
3. Standards pass: AGENTS.md, GLOSSARY.md, ADR 0001, repo docs, smell baseline, slop checklist (skill `code-review`). Check the conventions that linters do not: glossary words used consistently (no bare "GPA"/"semester" in identifiers or UI text), domain purity (no Svelte/storage imports under `src/lib/domain/`), runes-only Svelte, tokens-only styling (no hardcoded colors outside `src/app.css`), no money/GPA math in components, labels from T03 displayed verbatim. Run `python .jules/tools/slop_guard.py --base origin/main --strict` and include its output.
4. Cross-task pass: duplicated concepts across modules (e.g. two rounding helpers, two normalization rules for CourseCode), contracts bypassed (imports reaching into module internals instead of barrels), shallow modules (deletion test: could a panel's logic collapse into the page without loss?), T04's caught-RangeError boundaries actually covering every domain call, T05's README claims matching shipped behaviour.
5. Verify pass: run `npm ci && npm run verify` on the merged state and record the tail of the output; a failure here is finding F1 by definition.
6. Write the report; number each finding F1, F2... with the owning task and directory, so a fix wave can be sliced by owner without collisions.

## Acceptance criteria

1. `.jules/reports/T06.md` exists with `## Spec`, `## Standards` and `## Cross-task`, each under 400 words, every finding quoting its source.
2. Every user story U1..U9 appears in the Spec section as covered or as a finding.
3. The last line states findings per axis and the worst finding within each axis, with no single overall winner.
4. `git diff --name-only origin/integration/uiu-calculator...HEAD` shows only `.jules/reports/T06.md`.

## Decision defaults

Judgement-call smells are labelled "possible <smell>". A documented repo standard (AGENTS.md, ADR, spec) overrides the baseline. Skip what the linter already enforces. The Retake-replacement and FirstTerm-payment assumptions are documented in the spec's Further Notes: report a finding only if the implementation diverges from what the spec states, not because the assumption itself is unverifiable.

## Fallbacks

If the fixed point does not resolve, use `git merge-base origin/integration/uiu-calculator HEAD` and say so. If `npm run verify` cannot install browsers in the VM, run everything except `test:e2e`, and record that gap in the report instead of failing the task.

## Hand-off

The human sends this report to the architect with `REPLAN` (the architect's fix wave cites your finding numbers; a re-review follows every fix wave under the strict profile).
