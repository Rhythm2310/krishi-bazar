# T06: Review UIU Calculator v1 (tasks T01–T05)

Wave: 3 | Model: gemini pro 15 | Size: M | Mode: review
Branch: `jules/T06-review` | PR title: `[T06] Review UIU Calculator v1`
Skills: code-review; codebase-design

Read `/AGENTS.md` first. This task changes no code.

## Objective

Review everything merged since the swarm's fixed point along two axes, Spec and Standards, plus a cross-task pass, and report findings. A separate fix wave (arranged by the human with the architect) acts on them.

## Context pointers

- Fixed point: the pack commit on `main`. Resolve it with `git log --grep "chore: jules swarm setup" --format=%H -1 origin/main` and use that SHA as FIXED_POINT. Diff: `git diff FIXED_POINT...HEAD`.
- Spec: `.jules/spec.md` (user stories U1–U9, seams S1/S2, Implementation + Testing Decisions). Glossary: `GLOSSARY.md`. ADRs: `docs/adr/0001-localstorage-only-state.md`, `docs/adr/0002-retake-latest-wins.md`.
- Task reports: `.jules/reports/T01.md` … `T05.md` (first-red lines, decisions, requests, PARTIAL notes).
- Requests: `.jules/requests/` — every file there is an unresolved cross-task issue; include each in the report with your recommendation.

## Owned paths (write)

`.jules/reports/T06.md`

## Steps

1. Pin the fixed point (command above) and capture the diff and commit list (`git log --oneline FIXED_POINT..HEAD`). An empty or unresolvable diff: stop and report `[PARTIAL]` with what you tried.
2. **Spec pass**: for every story U1–U9, find the code and the test that delivers it (trace via `.jules/plan.md`'s story-to-task table, then verify in the tree). List: stories missing or partial, behaviour nobody asked for, implementations that contradict the spec's binding formulas (fee math, payment schedule, retake rule, rounding, empty states). Check the golden anchors really exist: the 12 published tier-0 program totals at S1, and the display goldens (`84,500`, `1,06,500`, `9,750`, `25,800`/`19,350`/`19,350`) at S2. Quote the spec line per finding.
3. **Standards pass**: AGENTS.md conventions (runes only, `import type`, no `any`, tokens-only styling, RangeError style, commit/PR naming), glossary naming in code/tests/UI labels, ADR compliance (no backend calls, no secrets, replacement rule as decided), smell baseline and slop checklist (skill `code-review`). Run `python .jules/tools/slop_guard.py --base FIXED_POINT` and include its output.
4. **Cross-task pass**: duplicated concepts across modules (two rounding helpers? two label vocabularies?), glossary terms used inconsistently between UI labels and tests, contracts bypassed (components doing math, stores calling data modules directly), shallow modules (deletion test: would removing a module lose real behaviour?), T04's boundary adaptations from its report — justified or hiding an engine bug.
5. Write `.jules/reports/T06.md`; number each finding F1, F2… with the owning task and directory, so a fix wave can be sliced by ownership without collisions.

## Acceptance criteria

1. `.jules/reports/T06.md` exists with `## Spec`, `## Standards` and `## Cross-task` sections, each under 400 words, every finding quoting its source (spec line, file path or report line).
2. Every user story U1–U9 appears in the Spec section as covered or as a finding.
3. The last line states findings per axis and the worst finding within each axis, with no single overall winner.
4. `git diff --name-only origin/main...HEAD` shows only `.jules/reports/T06.md`.

## Decision defaults

Judgement-call smells are labelled "possible <smell>". A documented repo standard (AGENTS.md, ADR, spec) overrides the baseline. Skip what the linter already enforces. VERIFY items in `.jules/plan.md` (retake rule, AdmissionFee-as-PreRegistrationPayment, Vercel runtime label) are assumptions to restate, not findings — unless the code contradicts them.

## Fallbacks

If the fixed point does not resolve (no commit matches the grep), use the first commit that introduced `package.json` (`git log --diff-filter=A --format=%H -1 -- package.json`) and say so in the report. If `origin/main` is unavailable, use `git merge-base main HEAD` and say so.

## Hand-off

The human sends this report to the architect with `REPLAN` (see `Task-prompt.md` Part 4). The fix wave cites your finding numbers; keep them stable and self-contained.
