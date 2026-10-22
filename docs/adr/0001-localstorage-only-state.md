# 0001. SavedTerms live in browser localStorage only — no backend, no accounts

Status: accepted | Date: 2026-10-23

## Context

The app keeps a Student's SavedTerms across visits so Cgpa can span Terms. The alternatives considered: (a) a backend with accounts and a database, (b) browser localStorage, (c) import/export files only. The data is personal, low-volume (a few KB per Student), needed on one device at a time, and contains no secrets. A backend would add auth, hosting state, privacy obligations and two more modules to the swarm plan, for a calculator whose entire domain is pure functions. Alternatives (b) and (c) were weighed against cross-device sync, which no stated user needs.

## Decision

All Student state (SavedTerms, selected Program, WaiverTier, FirstTerm flag) persists in browser localStorage under one versioned key. The domain stays pure: it receives state and returns results; it never reads storage itself. There is no server-side state anywhere in the app.

## Consequences

Easier: the deployed app is static output on Vercel with zero runtime cost and zero user data held; every domain function stays trivially testable at seam S1; the swarm needs no database, auth or API tasks, which keeps ownership disjoint. Harder: no cross-device sync and clearing browser data erases SavedTerms — the UI must say this plainly. A future backend must slot in behind the same state shape (the versioned storage key is the migration seam), so the stored JSON schema may not diverge from the domain types. Do not reverse this casually: introducing server state changes the deployment model, the privacy surface and the whole test strategy at once.
