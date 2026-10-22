# T14: Review buyer-journey segment

Wave: 13 | Model: default | Size: M | Mode: review
Branch: `jules/T14-review-buyer-journey` | PR title: `[T14] Review buyer-journey segment`
Skills: code-review, codebase-design
Serves: infrastructure (quality gate) | Seams under test: S1, S2, S3 (audited)

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
Audit the buyer-journey segment (T11 browse, T12 detail, T13 orders/lifecycle) — the money and stock core of the product — on both axes; numbered findings to the human. You edit no code.

## Context pointers

Fixed point and scope
Fixed point: the merge commit of T10 on `origin/main` (`git log --grep "\[T10\]"`). Scope = union of owned paths of T11–T13 per `.jules/tasks.csv` plus `git diff --name-only <T10-merge>..HEAD`.

## Owned paths (write)
.jules/reports/T14.md — nothing else.

## Steps
1. Read `.jules/spec.md` (U1–U5, U10 + Orders/Marketplace/Money decisions), ADR-0002, reports T11–T13, open `.jules/requests/*`.
2. Spec axis, at minimum: stock changes ONLY via `orders/stock.ts` conditional UPDATEs (grep the whole diff for `SET qty`); every transition via `order-machine.ts`; totals only via `orders/pricing.ts` (grep for arithmetic on paisa outside it); client estimate and server total share the one pure function; expiry swept from all three read paths and idempotent; buyer PII only on farmer dashboard + token-gated confirmation; farmer phone only on detail + confirmation; keyset pagination correctness (no overlap/dupes — read the property test); visibility matrix on detail (paused/deleted/zero-stock/owner); no floats in any money path (`parseFloat` audit); all strings in both dictionaries.
3. Standards axis: conventions, glossary naming in identifiers/tests/commits, slop checklist; run `python .jules/tools/slop_guard.py --base <T10-merge>`; deep-module check — could `orders/create.ts` be replaced by its callers (deletion test) or does it genuinely hide the transaction?
4. Cross-task pass: T13's edits inside `p/[id]/**` (owned since T12) — did the OrderBox mount preserve T12's visibility rules and meta tags? FreshnessBadge reuse consistent between card and detail? Rate-limit kinds match rates.ts? Dictionary keys collide across modules (duplicate keys in different files silently overwrite — check the glob merge order)?
5. Report: findings F1… with owning task + directory + quoted source.

## Acceptance criteria
1. `.jules/reports/T14.md` with `## Spec`, `## Standards`, `## Cross-task`, each under 400 words, findings quoted.
2. U1–U5 and U10 each appear as covered or as findings.
3. Last line: findings per axis + worst per axis, no single overall winner.
4. `git diff --name-only` shows only `.jules/reports/T14.md`.

## Decision defaults
Judgement-call smells labelled "possible <smell>"; documented repo standards override the baseline; skip what lint enforces.

## Fallbacks
If the T10 merge cannot be located, fall back to `git merge-base origin/main HEAD` and say so.

## Hand-off
The human sends this report to the architect with `REPLAN`. Clean → chain continues at T15.
