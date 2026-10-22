# T10: Review farmer-sell segment

Wave: 9 | Model: default | Size: M | Mode: review
Branch: `jules/T10-review-farmer-sell` | PR title: `[T10] Review farmer-sell segment`
Skills: code-review, codebase-design
Serves: infrastructure (quality gate) | Seams under test: S1, S2 (audited)

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
Audit the farmer-sell segment (T06 auth, T07 photo pipeline, T08 fair pricing, T09 create listing) on both axes; numbered findings to the human. You edit no code.

## Context pointers

Fixed point and scope
Fixed point: the merge commit of T05 on `origin/main` (use `git log --grep "\[T05\]"` to locate it). Scope = union of owned paths of T06–T09 per `.jules/tasks.csv`, plus every file those PRs changed (`git diff --name-only <T05-merge>..HEAD`).

## Owned paths (write)
.jules/reports/T10.md — nothing else.

## Steps
1. Read `.jules/spec.md` (U7, U8 + Auth/Photos/Fair-price/Validation decisions), `GLOSSARY.md`, ADR-0001/0002, reports `T06.md`, `T07.md`, `T08.md`, `T09.md`, and any `.jules/requests/*` filed.
2. Spec axis, at minimum: scrypt parameters and timing-safe compare actually used; session tokens stored hashed only; cookie flags exact (httpOnly, SameSite=Lax, Secure in prod); open-redirect guard present; rate limits on register/login/upload-token with `ip_events` persistence; WebP-only enforced server-side in BOTH storage modes incl. magic bytes; direct-to-blob flow never routes bytes through a function body in blob mode; advisory never constrains the stored price; money enters the DB only via `takaStrToPaisa`; qty only via hundredths; every user-visible string in both dictionaries.
3. Standards axis: AGENTS.md conventions, glossary naming, slop checklist (skill `code-review`); run `python .jules/tools/slop_guard.py --base <T05-merge>` and include notable output; check ListingForm edit-mode genericity (deletion test) since T16 depends on it.
4. Cross-task pass: auth session lookup cost in hooks (one query per request — flag N+1 patterns), rate-limit kind strings consistent with rates.ts, PhotoPicker↔T09 contract (photos string[] ≤3), pricing history param wired from the load function, duplicate validation logic between component and server (server must be the only source of truth).
5. Write the report; findings F1… numbered with owning task + directory, quoting sources.

## Acceptance criteria
1. `.jules/reports/T10.md` with `## Spec`, `## Standards`, `## Cross-task`, each under 400 words, findings quoted.
2. U7 and U8 each appear as covered or as findings.
3. Last line: findings per axis + worst per axis, no single overall winner.
4. `git diff --name-only` shows only `.jules/reports/T10.md`.

## Decision defaults
Judgement-call smells labelled "possible <smell>"; documented repo standards override the baseline; skip what lint enforces.

## Fallbacks
If the T05 merge commit cannot be located, fall back to `git merge-base origin/main HEAD` and say so.

## Hand-off
The human sends this report to the architect with `REPLAN`. Clean → chain continues at T11.
