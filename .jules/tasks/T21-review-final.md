# T21: Final review

Wave: 20 | Model: default | Size: M | Mode: review
Branch: `jules/T21-review-final` | PR title: `[T21] Final review`
Skills: code-review, codebase-design
Serves: infrastructure (final quality gate) | Seams under test: S1, S2, S3 (audited)

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
The last gate before the human merges and deploys: audit the ENTIRE merged product against the whole spec on both axes, plus the cross-cutting properties no single-segment review could see. Numbered findings to the human. You edit no code.

## Context pointers

Fixed point and scope
Fixed point: the merge commit of T18 on `origin/main` for the delta (`git log --grep "\[T18\]"`), plus a whole-tree read of `src/`, `e2e/`, `drizzle/`, `scripts/`, `.github/`, `docs/`, `README*.md`. Scope includes T19 and T20 output and every earlier segment's cumulative state.

## Owned paths (write)
.jules/reports/T21.md — nothing else.

## Steps
1. Read `.jules/spec.md` completely, `GLOSSARY.md`, ADRs 0001–0004, ALL reports in `.jules/reports/`, and every `.jules/requests/*` (each request is either resolved, or becomes a finding).
2. Spec axis — story-by-story verdict: for each of U1–U16 find the test(s) that prove it (name them in the report) or raise a finding. Then the spec's cross-cutting promises: money integer paisa end to end (grep audit), Asia/Dhaka pinned everywhere dates matter, WebP-only storage in both modes, buyer PII confined to dashboard+confirmation, farmer phone confined to detail+confirmation, bilingual parity (run the parity test), no third-party runtime requests (CSP + network idle check in an e2e trace), all four ADRs honored in code.
3. Standards axis: full slop sweep `python .jules/tools/slop_guard.py --strict --base $(git rev-list --max-parents=0 HEAD)` (whole history added-lines); `bun run verify` from clean (record the tail); coverage report numbers vs gates; Lighthouse enforced-mode result; commit history conventional-commit clean (`git log --oneline` scan).
4. Cross-task pass (the whole-system lens): duplicate concepts between modules (two freshness paths? two total computations? — grep); glossary drift in identifiers vs GLOSSARY.md; contract bypasses (any import reaching into another module's internals past its interface); shallow modules (deletion test on market.ts, orders/*, pricing.ts); dead code (unused exports — `knip`-style manual scan of `src/lib` exports vs imports); dependency direction violations (domain importing db/server/Svelte — grep); e2e specs that assert implementation details instead of behaviour.
5. Competition readiness (spec Further Notes): README claims vs reality (spot-run three documented commands); screenshots current; demo path on a seeded DB smooth (register→list→order→accept); dark mode + both locales + 360px coherent.
6. Report: `## Spec` (story verdicts U1–U16 one line each + findings), `## Standards`, `## Cross-task`, `## Competition readiness`, each under 400 words; findings F1… with owner task + directory + quoted source.

## Acceptance criteria
1. `.jules/reports/T21.md` exists with the four sections, every finding quoting its source.
2. Every user story U1–U16 appears with a verdict: covered (naming its tests) or finding.
3. The last line states findings per axis and the worst finding within each axis, with no single overall winner.
4. `git diff --name-only` shows only `.jules/reports/T21.md`.

## Decision defaults
Judgement-call smells labelled "possible <smell>"; documented repo standards override the baseline; skip what lint enforces. Competition-readiness items are findings only when they contradict the spec or README claims.

## Fallbacks
If the T18 merge cannot be located, use `git merge-base origin/main HEAD` for the delta and say so; the whole-tree pass is unaffected.

## Hand-off
The human runs `python .jules/tools/swarm.py replan` and sends `replan.md` to the architect with `REPLAN`. The architect turns findings into a fix wave (disjoint owners, fix-mode tasks with `diagnosing-bugs` enabled), then one re-review closes the plan.
