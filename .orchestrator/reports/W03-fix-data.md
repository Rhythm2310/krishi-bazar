# W03 Fixer — data

## Meta
- **Branch:** jules/w03-fix-data
- **Status:** DONE
- **Date:** 2026-10-23
- **Final SHA:** 62ce0ce463d0271abcfd6d5fb1a1752740485820

## 1. Summary
Corrected seeded datasets for `PROGRAMS` and `GRADING_SCALE` based on official tables, fixing multiple credit and published total values and adding the missing BSSEDS row. Protected these with hard-coded pin tests which now correctly lock the seed array. Created the `policyNotes.ts` module with specified facts and data sources. Hardened `storage.ts` by ensuring all `localStorage` reads/writes and `JSON.parse` commands are wrapped in `try/catch` and fallback securely. Added `.orchestrator/scratch/` back to the `.gitignore`. Updated `ARCH_PLAN.md` with targeted fixes.

## 2. Evidence of Heartbeat
`make smoke` exit status: `0`

```
./scripts/smoke.sh
bun install v1.2.14 (6a363a38)

Checked 32 installs across 73 packages (no changes) [7.00ms]
bun test v1.2.14 (6a363a38)
vite v8.3.5 building client environment for production...
transforming...
✓ 26 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-BIqJqfRm.css    1.50 kB │ gzip:  0.62 kB
dist/assets/index-8eygMcsH.js   239.60 kB │ gzip: 73.49 kB

✓ built in 206ms
Waiting for server on port 4173...
  ➜  Local:   http://localhost:4173/
  ➜  Network: use --host to expose
SMOKE OK
```

## 3. Deviations
- None.

## 4. Observations
- The W02 T-1 review erroneously reported that the programs and totals in `programs.ts` matched the official data because it was comparing self-consistent derived variables. We successfully identified and patched multiple mismatches against the truth table in `ARCH_PLAN.md`.

## 5A. Finding-by-finding

| ID | Status | Red test output | Green test output | Files | Notes |
|---|---|---|---|---|---|
| DF-1 | FIXED | `Seed transcription audit > GRADING_SCALE matches official table exactly error: expect(received).toEqual(expected) ... Seed transcription audit > PROGRAMS matches official table exactly error: expect(received).toHaveLength(expected) Expected length: 19 Received length: 18` | `(pass) Seed transcription audit > GRADING_SCALE matches official table exactly [0.12ms] (pass) Seed transcription audit > PROGRAMS matches official table exactly [0.31ms] 21 pass 0 fail` | `src/data/programs.ts`, `src/data/gradingScale.ts`, `src/data/__tests__/seed.test.ts` | Found `Very poor` instead of `Very Poor` in grading. Found completely missing `BSSEDS` and several credit/total mismatches in `PROGRAMS`. Pin tests written. |
| DF-2 | FIXED | N/A | N/A | `src/data/policyNotes.ts` | Module created and structure populated according to ARCH_PLAN section 4. Verified it is not wired anywhere in UI via grep. |
| DF-3 | FIXED | `TypeError: undefined is not an object (evaluating 'globalThis.localStorage.getItem')` and `ReferenceError: localStorage is not defined` | `(pass) Storage hardening > corrupt/truncated JSON -> returns defaults, no throw [0.37ms] (pass) Storage hardening > getter that throws (quota/security error) -> returns defaults, no throw [0.09ms] (pass) Storage hardening > setter that throws -> swallowed with safe fallback [0.27ms]` | `src/state/storage.ts`, `src/state/__tests__/storage.test.ts` | Used a safe internal helper `getStorage` function to bypass Node.js and Bun evaluation problems with `globalThis.localStorage` mocking in DOM-free tests. |
| DF-4 | FIXED | N/A | `.gitignore:25:.orchestrator/scratch/ .orchestrator/scratch/probe.ts` | `.gitignore` | Restored line. |
| DF-5 | FIXED | N/A | N/A | `.orchestrator/ARCH_PLAN.md` | Successfully replaced string literals precisely according to the prompt scope. |
