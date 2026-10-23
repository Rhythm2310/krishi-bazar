# 0001. Browser-local state only: no accounts, no backend

Status: accepted | Date: 2026-10-23

## Context

SavedTerms (the Student's finished Term plans that feed the Cgpa) must survive reloads and repeat visits. The alternatives: (a) a backend with accounts and a database, (b) browser localStorage, (c) no persistence. A backend adds secrets, deployment moving parts, moderation of user data and at least two extra swarm tasks for zero revenue; the app is a pure client-side calculator. No persistence would make the Cgpa story (U4) useless across visits. The whole app prerenders to static output, so any server-side state would also break the Vercel static deployment.

## Decision

All Student state (Program choice, FirstTerm flag, WaiverTier, SavedTerms, Planner) lives in the browser under one versioned localStorage key (`uiu-calculator.state.v1`). Unparseable or wrong-version data starts empty and keeps the raw string under a `.bak` key. There are no accounts, no server calls, no secrets, no environment variables.

## Consequences

Easy: zero infrastructure, zero secrets, offline-capable, trivially testable at seam S2 (write, reload, read). Hard: no cross-device sync and no recovery after clearing browser data — accepted, and stated in the README. Do not reverse this casually: every domain module and the whole CI pipeline assume a static, secret-free app; a backend would change the deploy target, the threat model and half the plan.
