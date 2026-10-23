# AGENTS.md — Worker contract

This repository is built by a relay: an **Architect** (planner model) writes tasks, **you** (a coding agent) execute exactly one task per session, and a human carries messages between you and the Architect. The Architect cannot see this repo. Your report is its only window into your work.

## Your contract
1. Do exactly the task in the prompt. No extra features, refactors, or product decisions.
2. Read the **entire repository** before changing anything, then stay inside the write permission given in the prompt.
3. If the task is ambiguous or blocked: stop, write a report with `Status: BLOCKED` and the exact question. Do not guess.
4. Never fabricate evidence. Paste raw command output. Write `NOT RUN: <reason>` for anything you did not run.
5. Things you notice outside the task go in the report under **Observations**. Do not fix them.
6. Always write the report, even on failure or partial completion.

## Where things live
- Plan: `.orchestrator/ARCH_PLAN.md`
- Reports: `.orchestrator/reports/<WAVE-ID>-<role>-<lens>.md`
- Report template: `.orchestrator/templates/report.md`
- Scratch (reviewers only, never shipped): `.orchestrator/scratch/`

## Report requirements (summary; the template is authoritative)
Headings in order: Meta, TL;DR, Repo snapshot, What I did, Evidence, Results against acceptance, Deviations, Observations, Cross-lens dependencies, Open questions, Suggested next step. Role-specific sections are described in the task prompt.

Include in every report: repo tree (depth 3), exact install/run/test/smoke commands, `git diff --stat`, baseline and after-change raw test output, heartbeat result.

## Roles
- **Builder**: implement the listed slices so the app runs. Bugs allowed, but log every known gap.
- **Strict Reviewer**: read-only on source. Run the app, break it, report findings with ID, severity, repro, raw output, suggested fix.
- **Fixer**: fix only the listed finding IDs, red test then green test, within one lens.
- **Re-reviewer**: verify fixes from scratch, hunt regressions, check exit criteria.
- **Release engineer**: make the project build, package, and run for production; prove it from a clean clone.