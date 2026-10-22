---
name: code-review
description: Two-axis review (Spec, then Standards) of a diff against a fixed point. Load it for self-review before every PR, and as the method for review-mode tasks.
---

# Code review (swarm edition)

Adapted from mattpocock/skills `code-review` (MIT). See `../NOTICE.md`.

A change can follow every convention and build the wrong thing (Standards pass, Spec fail), or build exactly the right thing in violation of conventions (Spec pass, Standards fail). Keep the axes **separate**: review once per axis, never merge or re-rank findings across them.

## 1. Pin the fixed point
Self-review: `git merge-base origin/<base branch> HEAD`. Review-mode task: the fixed point named in the task file. Capture the diff once: `git diff <fixed-point>...HEAD` and `git log <fixed-point>..HEAD --oneline`. An empty or unresolvable diff is an error; stop and report.

## 2. Pass one: Spec
Sources, in order: your task file's Objective and Acceptance criteria, then the user stories it cites from `.jules/spec.md`. Report, quoting the source line for each:
- requirements missing or partial
- behaviour in the diff nobody asked for (scope creep)
- requirements that look implemented but whose implementation looks wrong
Read this pass against the diff only, as if you had not written it.

## 3. Pass two: Standards
Sources: AGENTS.md sections 3, 4, 6; repo docs such as CONTRIBUTING or coding standards; the glossary (names match it); ADRs in the touched area; then the smell baseline below. Documented standards are hard findings. Baseline smells are always judgement calls ("possible Feature Envy"), and a documented repo standard overrides them. Skip anything the linter or type checker already enforces.

Smell baseline (smell: fix):
- Mysterious Name: rename; if no honest name comes, the design is murky.
- Duplicated Code: extract the shared shape.
- Feature Envy: move the method onto the data it uses.
- Data Clumps: bundle the travelling fields into a type.
- Primitive Obsession: give the domain concept its own small type.
- Repeated Switches: one polymorphic site or one shared map.
- Shotgun Surgery: gather what changes together into one module.
- Divergent Change: split a module that changes for unrelated reasons.
- Speculative Generality: delete abstraction the spec does not need.
- Message Chains: hide the walk behind one method.
- Middle Man: call the real target directly.
- Refused Bequest: replace inheritance with composition.

Slop checklist (each is a hard finding): leftover debug output or `[DEBUG-` tags; bare TODO/FIXME; stub language ("implement me", "rest of the code"); commented-out code; suppressed lint or type errors; skipped, focused or assertion-free tests; tautological or call-count-only tests; mocks of your own modules; a comment that restates the code beside it; a helper, parameter or option used by nothing; error handling that swallows. Run `python .jules/tools/slop_guard.py` to catch the mechanical ones.

## 4. Act on findings (self-review)
- Fix every Spec gap and every hard Standards finding inside your owned paths.
- Fix judgement-call smells when the fix is small and safe. Otherwise list them in the report as "left" with the reason.
- A finding in code you do not own becomes a request (`.jules/requests/<ID>-<slug>.md`).
- Re-run the verify command and `slop_guard.py` after the fixes. Then write the report.

## 5. Review-mode task output
No code edits. Write `.jules/reports/<ID>.md` with `## Spec` and `## Standards`, each under 400 words, every finding quoting its source line or hunk. End with one line: findings per axis and the worst finding within each axis. Pick no single winner across axes.
