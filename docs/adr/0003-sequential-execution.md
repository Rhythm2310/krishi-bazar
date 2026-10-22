# 0003. Sequential single-agent execution instead of a concurrent swarm

Status: accepted | Date: 2026-10-22

## Context
The standard plan shape runs waves of 3–7 Jules agents concurrently. The owner requires one agent
per task with no concurrency. The plan tooling supports this: `plan_concurrent: 1` in
`.jules/swarm.json` and one task per wave yields a linear chain the validator accepts (small-wave
messages are notes, not errors).

## Decision
Every wave contains exactly one task; tasks run strictly in dependency order, launched one at a
time via `swarm.py launch`. The strict profile's review tasks are interleaved after each
integration point, so the chain alternates build and review tasks.

## Consequences
Collisions are impossible by construction and ownership rules become a safety net rather than a
live constraint. Throughput drops: with roughly twenty tasks and a strict-profile review cadence,
a Free-tier daily limit (15 tasks/day, plan keeps 30% headroom) spreads the build over two days of
launches. Do not "optimize" by batching waves — the owner chose serial execution deliberately.
