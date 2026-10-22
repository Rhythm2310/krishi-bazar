---
name: pr
description: The shape of a pull request body for a swarm task: smallest-visual summary, before/after evidence, and a merge-danger call. Load it when opening the PR.
---

# Pull request body (swarm edition)

Adapted from mattpocock/skills `pr` (MIT), which credits Dex Horthy (HumanLayer `show-me`). See `../NOTICE.md`.

Use `.github/pull_request_template.md`. No preamble, brief prose, vocabulary from the glossary.

## Summary
Pick the smallest view that makes the key point clear. Logic: pseudocode. Runtime flow: a call tree. UI structure: a component tree. File responsibility or broad refactor: a shallow file tree. Interaction or data flow: a Mermaid diagram. What changes in something that already exists: a `diff` block. Place each visual beside the sentence it supports; use one or two, rarely all.

## Evidence
Show before and after. For a visual change, a screenshot when the environment allows. Otherwise execution evidence: the exact test that failed before and passes now (the red line from your report, then the green run), or console output.

## Merge danger
- **Door**: one-way (destructive or hard to reverse) or two-way (cheap to roll back).
- **Blast radius**: one word, then the realistic ramifications: consumers that break, layout shift, mobile, migrations.

Then the template's ownership check, assumptions and requests list.
