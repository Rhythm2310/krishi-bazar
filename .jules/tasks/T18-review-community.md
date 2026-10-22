# T18: Review community segment

Wave: 17 | Model: default | Size: M | Mode: review
Branch: `jules/T18-review-community` | PR title: `[T18] Review community segment`
Skills: code-review, codebase-design
Serves: infrastructure (quality gate) | Seams under test: S1, S2 (audited)

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
Audit the community-and-management segment (T15 comments, T16 listing management, T17 seed/DX) on both axes; numbered findings to the human. You edit no code.

## Context pointers

Fixed point and scope
Fixed point: the merge commit of T14 on `origin/main` (`git log --grep "\[T14\]"`). Scope = union of owned paths of T15–T17 per `.jules/tasks.csv` plus `git diff --name-only <T14-merge>..HEAD`.

## Owned paths (write)
.jules/reports/T18.md — nothing else.

## Steps
1. Read `.jules/spec.md` (U6, U9, U11, U15 + Comments/Listing-management decisions), reports T15–T17, open `.jules/requests/*`.
2. Spec axis, at minimum: rate limit BOTH windows enforced server-side on every comment mutation; honeypot silent-drop leaves no rows; verified badge computed at read (no stored column — grep schema); single farmer reply enforced (index or transactional check per T15 fallback — confirm which shipped); ownership checks on all four manage ops (foreign farmer → not-found class, not 403 leaking existence); category/unit immutability on edit; soft-delete only (no DELETE statements on listings — grep); seed refuses DATABASE_URL; seed deterministic (no Math.random/wall-clock in the planner); no out-of-season categories possible (read the season tests).
3. Standards axis: conventions, glossary naming, slop checklist; `python .jules/tools/slop_guard.py --base <T14-merge>`; deletion test on `comments/list.ts` (does it genuinely hide the EXISTS join?); accessibility of the reply toggle and confirm dialog.
4. Cross-task pass: T15/T16 both edited `p/[id]` and `listings` surfaces — did T12/T13/T09 tests stay green (read CI history in reports); dictionary key collisions across modules; ip_events `kind` strings consistent with rates.ts everywhere; manage-page orderCount semantics match T13's definition.
5. Report: findings F1… with owning task + directory + quoted source.

## Acceptance criteria
1. `.jules/reports/T18.md` with `## Spec`, `## Standards`, `## Cross-task`, each under 400 words, findings quoted.
2. U6, U9, U11, U15 each appear as covered or as findings.
3. Last line: findings per axis + worst per axis, no single overall winner.
4. `git diff --name-only` shows only `.jules/reports/T18.md`.

## Decision defaults
Judgement-call smells labelled "possible <smell>"; documented repo standards override the baseline; skip what lint enforces.

## Fallbacks
If the T14 merge cannot be located, fall back to `git merge-base origin/main HEAD` and say so.

## Hand-off
The human sends this report to the architect with `REPLAN`. Clean → chain continues at T19.
