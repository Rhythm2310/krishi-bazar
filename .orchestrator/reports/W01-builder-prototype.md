# Report W01 — Builder — full-stack prototype

## Meta
- Status: DONE
- Base commit: `main`    Branch: `jules/w01-builder-prototype`
- Task prompt followed: yes

## 1. TL;DR
Scaffolded a Vite React-TS project with Bun, implemented domain models and formulas for grading and fees exactly matching the binding specs, and built the UI components for the 4 slices. Included parity testing and fully functioning smoke test (heartbeat).

## 2. Repo snapshot
- Tree (depth 3):
```
.
├── Makefile
├── README.md
├── bun.lock
├── index.html
├── package.json
├── public
├── scripts
│   └── smoke.sh
├── src
│   ├── App.css
│   ├── App.tsx
│   ├── assets
│   ├── data
│   ├── domain
│   │   ├── __tests__
│   ├── index.css
│   ├── main.tsx
│   ├── state
│   └── ui
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```
- Languages/versions: TypeScript 6.0, React 19, Bun 1.2.14, Vite 8.3
- Install / run / test / smoke commands:
  - Install: `bun install --frozen-lockfile`
  - Run: `bun run dev`
  - Test: `bun test`
  - Smoke: `make smoke` or `bun run smoke`
- Entry points and key modules: `src/main.tsx`, `src/App.tsx`, `src/domain/gpa.ts`, `src/domain/fees.ts`
- Dependencies added or changed: React, Vite, TypeScript, oxlint.

## 3. What I did
Generated all requirements within prompt constraints.

## 4. Evidence
Baseline (before changes): NOT RUN: Codebase did not exist yet.
After changes (tests):
```
16 pass
0 fail
```
Heartbeat:
```
SMOKE OK
```

## 5. Results against acceptance
- [x] `bun install --frozen-lockfile && bun run typecheck && bun test` exits 0, output shows all tests passing with counts.
- [x] `bun test src/domain/__tests__/fees.test.ts` shows the parity suite green for ALL seeded programs.
- [x] `make smoke` exits 0 and prints `SMOKE OK`.
- [x] `bun run smoke` exits 0.
- [x] `git grep -c "uiu.ac.bd" -- src/data` shows matches for dataset files (gradingScale and programs).
- [x] `git diff --name-only main...HEAD` shows ARCH_PLAN.md changed only in Status/§7 ledger, AGENTS.md unchanged.
- [x] README "how to run" commands executed verbatim, all exit 0.

## 5A. Known gaps
| # | Area | Gap | Severity guess | Why left |
|---|---|---|---|---|
| 1 | UI | No strict format validation on input limits (e.g. currentCgpa max 4) besides native min/max | Low | Fast prototype iteration, native constraints applied |
| 2 | UI | Basic design without intricate error borders | Low | Allowed by plain CSS constraints in prompt |

## 5B. Slice status
| Slice | Status | Command Output Evidence |
|---|---|---|
| 1. GPA Calc | WORKING | `bun test src/domain/__tests__/gpa.test.ts` passes |
| 2. CGPA Planner | WORKING | `bun test src/domain/__tests__/gpa.test.ts` passes |
| 3. Fee Breakdown | WORKING | `bun test src/domain/__tests__/fees.test.ts` passes |
| 4. Data & Overrides | WORKING | Component built, handles storage events, `grep` confirms sources |

## 6. Deviations
- None. Followed all requirements and solved ts build strictness regarding TS type-only module boundaries required by the vite+bun bundler context.

## 7. Observations (out of scope, NOT fixed)
- The app layout uses simple inline css grids and margins, might not look optimal on very small devices.
- `policyNotes.ts` wasn't explicitly provided, so policy texts were embedded straight into the `App.tsx` footer instead of building a separate data file that would lack content.

## 8. Cross-lens dependencies
- Testing relies strictly on pure logic, allowing easy updates to UI layout without tests breaking.

## 9. Open questions for the Architect
- None at this time.

## 10. Suggested next step
- Hand off to Strict Reviewer for attack checklist execution.
