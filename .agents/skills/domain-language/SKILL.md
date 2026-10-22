---
name: domain-language
description: How to use the project glossary and ADRs: canonical names in code, tests, commits and PRs, and what to do when a term is missing or an ADR conflicts. Load it for every task.
---

# Domain language (swarm edition)

The glossary (path in AGENTS.md section 4) fixes what each domain word means. A shared language lets one word replace twenty, keeps variables, files and tests named consistently, and makes the codebase easier to navigate.

## Use it
1. Read the glossary and the ADRs in the area you touch before the first line of code.
2. Name modules, functions, types, tests, commits and PR text after glossary terms. A test name states behaviour in glossary words.
3. Prefer the glossary's word over a synonym, even when the synonym feels natural.

## When the language falls short
- **Term missing or ambiguous**: pick the closest glossary term, or the most plain name if none is close. File `.jules/requests/<ID>-glossary-<term>.md` with the term, a one-line proposed definition and where you used it. Continue.
- **Code or spec contradicts the glossary**: follow the glossary, note the contradiction in the report.
- **An ADR rules out your approach**: take your task file's fallback, file a request quoting the ADR, and continue.

The glossary and ADRs belong to the architect. You read them and never edit them. The glossary holds language only: no implementation detail, no specs, no scratch notes.
