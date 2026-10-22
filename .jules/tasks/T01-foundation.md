# T01: Foundation scaffold, contracts, CI-verified toolchain and tracer

Wave: 0 | Model: gemini pro 15 | Size: L | Mode: foundation
Branch: `jules/T01-foundation` | PR title: `[T01] Foundation scaffold contracts and tracer`
Skills: domain-language; tdd; codebase-design; code-review; pr
Serves: U1, U9 | Seams under test: S1, S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective

A fresh clone of this repo builds, lints, type-checks, tests and produces a Vercel-ready static build with one command (`npm run verify`), and one thin end-to-end path is green: the Planner page renders, a Student enters one Course, and the TermGpa appears — proving scaffold, toolchain, frozen contract, frozen data and both seams work before any sibling module is built.

## Context pointers

Read these when the condition holds; each is a path, not a copy.
- Always: `GLOSSARY.md`; `.jules/spec.md` stories U1, U9 and seams S1, S2; `.jules/deps.csv` (every version below comes from it).
- When touching persistence or state decisions: `docs/adr/0001-localstorage-only-state.md`.
- Earlier work you build on: none (you are the foundation).

## Owned paths (write)

```
package.json
package-lock.json
svelte.config.js
vite.config.ts
tsconfig.json
eslint.config.js
.prettierrc
.prettierignore
playwright.config.ts
src/app.html
src/app.css
src/app.d.ts
src/routes/+layout.svelte
src/routes/+layout.ts
src/routes/+page.svelte
src/lib/domain/contracts.ts
src/lib/domain/data/**
src/lib/domain/grading/**
static/**
tests/e2e/smoke.spec.ts
.github/workflows/**
```

Also yours: `.jules/reports/T01.md`

## Read-only inputs

`.jules/spec.md`, `.jules/deps.csv`, `GLOSSARY.md`, `docs/adr/**`, `.jules/tools/**` (run the guards, never edit).

## Forbidden

- Any path not listed under Owned paths. In particular: `AGENTS.md`, `GLOSSARY.md`, `.jules/**`, `.agents/**`, `README.md` (T05 owns it — do not create one).
- Editing `.github/workflows/ci.yml`: you own it (it is in your `owns` so no other task or the CI fixer can touch it), but the pack ships it complete — read it so your `package.json` scripts match its steps, and change nothing. If it ever needs a change, file a request (AGENTS.md 5.7).
- New dependencies or version changes. The pre-installed set is pinned in `.jules/deps.csv`; the package.json below is the exact allowed content. Library APIs below are for these pinned versions (SvelteKit 3.0.1, Svelte 5.57.2 runes, Vite 8.3.4, Vitest 5.0.3, Playwright 1.64.0, TypeScript 6.0.3, ESLint 10.12.0 flat config).
- Git: the repo and base branch `integration/uiu-calculator` already exist. Never force-push, never merge.

## Steps

Write each file with exactly the content given, then install and verify. Every version is pinned exactly — never add `^` or `~`.

1. `package.json` (exact content):

```json
{
  "name": "uiu-calculator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.17" },
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "lint": "prettier --check . && eslint .",
    "format": "prettier --write .",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "verify": "npm run lint && npm run check && npm run test:unit && npm run test:e2e && npm run build"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@playwright/test": "1.64.0",
    "@sveltejs/adapter-vercel": "7.0.0",
    "@sveltejs/kit": "3.0.1",
    "@sveltejs/vite-plugin-svelte": "7.3.1",
    "@types/node": "24.19.2",
    "eslint": "10.12.0",
    "eslint-config-prettier": "10.1.8",
    "eslint-plugin-svelte": "3.23.1",
    "globals": "17.13.0",
    "prettier": "3.9.9",
    "prettier-plugin-svelte": "4.1.1",
    "svelte": "5.57.2",
    "svelte-check": "4.7.6",
    "tslib": "2.8.1",
    "typescript": "6.0.3",
    "typescript-eslint": "8.71.1",
    "vite": "8.3.4",
    "vitest": "5.0.3"
  }
}
```

Done when: `npm install` exits 0 and creates `package-lock.json`. Commit the lockfile; it is the frozen install for CI and every later task.

2. `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
```

3. `vite.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
```

4. `tsconfig.json`:

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

5. `eslint.config.js` (flat config, ESLint 10):

```js
import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: [
			'.svelte-kit/**',
			'build/**',
			'.vercel/**',
			'test-results/**',
			'playwright-report/**',
			'playwright/.cache/**',
			'node_modules/**'
		]
	},
	js.configs.recommended,
	tseslint.configs.recommended,
	svelte.configs.recommended,
	prettier,
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: { parser: tseslint.parser }
		}
	},
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'no-console': ['error', { allow: ['warn', 'error'] }]
		}
	}
);
```

6. `.prettierrc`:

```json
{
  "useTabs": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
```

7. `.prettierignore`:

```
package-lock.json
.svelte-kit/
build/
.vercel/
test-results/
playwright-report/
playwright/.cache/
.jules/
.agents/
.github/
AGENTS.md
GLOSSARY.md
docs/adr/
```

Done when: `npx prettier --check .` exits 0 (architect-owned docs are ignored; your new source files are formatted — run `npm run format` on them if needed).

8. `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: [['list']],
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'retain-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'npm run build && npm run preview -- --port 4173',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 240_000
	}
});
```

9. `src/app.html`:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.svg" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>UIU Calculator</title>
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

10. `src/app.d.ts`:

```ts
// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
```

11. `src/app.css` — the design tokens. Frozen after this wave; components consume these custom properties and never hardcode colors or spacings:

```css
:root {
	--color-bg: #0f172a;
	--color-surface: #1e293b;
	--color-border: #334155;
	--color-text: #e2e8f0;
	--color-text-muted: #94a3b8;
	--color-accent: #38bdf8;
	--color-accent-strong: #0ea5e9;
	--color-success: #4ade80;
	--color-warning: #fbbf24;
	--color-danger: #f87171;
	--radius: 0.5rem;
	--space-1: 0.25rem;
	--space-2: 0.5rem;
	--space-3: 1rem;
	--space-4: 1.5rem;
	--font-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
	--font-mono: ui-monospace, 'Cascadia Mono', monospace;
	color-scheme: dark;
}

*,
*::before,
*::after {
	box-sizing: border-box;
}

body {
	margin: 0;
	font-family: var(--font-sans);
	background: var(--color-bg);
	color: var(--color-text);
	line-height: 1.5;
}

h1,
h2,
h3 {
	line-height: 1.2;
}

input,
select,
button,
textarea {
	font: inherit;
	color: inherit;
}

a {
	color: var(--color-accent);
}
```

12. `static/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0ea5e9"/><text x="16" y="22" font-family="system-ui, sans-serif" font-size="16" font-weight="700" text-anchor="middle" fill="#0f172a">U</text></svg>
```

13. `src/lib/domain/contracts.ts` — the frozen contract. Every shared type lives here; after this wave it changes only via an amendment task. Exact content:

```ts
/** Frozen contract: shared domain types and function signatures.
 * Domain modules implement the *Fn types below and never import Svelte, routes or storage. */

export type LetterGrade = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';

export type TermSystem = 'trimester' | 'semester';

export type ProgramId =
	| 'bba'
	| 'bba-ais'
	| 'bseco'
	| 'bsseds'
	| 'bscse'
	| 'bsds'
	| 'bseee'
	| 'bsc-civil'
	| 'bpharm'
	| 'ba-english'
	| 'bssmsj'
	| 'bsbge';

export type WaiverTier = 0 | 25 | 50;

export interface GradePointEntry {
	letter: LetterGrade;
	point: number;
	minPercent: number;
	maxPercent: number;
	assessment: string;
}

export interface Program {
	id: ProgramId;
	name: string;
	totalCredits: number;
	perCreditFee: number;
	termSystem: TermSystem;
	termsTotal: number;
	labFeePerTerm: number;
}

export interface FeeRules {
	trimesterFee: number;
	semesterFee: number;
	admissionFee: number;
	cautionMoney: number;
	preRegistrationPayment: number;
	retakeWaiverFraction: number;
	installmentPlanTrimester: readonly number[];
	installmentPlanSemester: readonly number[];
	effectiveDate: string;
	gradingSourceUrl: string;
	feesSourceUrl: string;
}

export interface CourseEntry {
	id: string;
	code: string;
	title: string;
	credits: number;
	grade: LetterGrade;
	isRetake: boolean;
}

export interface TermRecord {
	id: string;
	label: string;
	courses: CourseEntry[];
}

export interface GpaResult {
	gpa: number;
	earnedCredits: number;
	totalCredits: number;
}

export interface CgpaResult {
	cgpa: number;
	earnedCredits: number;
	totalCredits: number;
	replacedCodes: string[];
}

export type FeeLineKind =
	| 'tuition-gross'
	| 'retake-waiver'
	| 'tier-waiver'
	| 'term-fee'
	| 'lab-fee'
	| 'admission-fee'
	| 'caution-money';

export interface FeeLine {
	label: string;
	amount: number;
	kind: FeeLineKind;
}

export interface FeeBreakdown {
	lines: FeeLine[];
	tuitionGross: number;
	retakeWaiver: number;
	tierWaiver: number;
	tuitionNet: number;
	totalDue: number;
	refundable: number;
}

export interface Installment {
	label: string;
	amount: number;
}

export interface PaymentSchedule {
	preRegistration: number;
	installments: Installment[];
	note: string;
}

export interface ProgramTotal {
	tuitionTotal: number;
	termFeesTotal: number;
	labFeesTotal: number;
	admissionFee: number;
	total: number;
}

export interface FeeInput {
	programId: ProgramId;
	creditsPlanned: number;
	retakeCredits: number;
	isFirstTerm: boolean;
	waiverTier: WaiverTier;
}

export type GradePointFn = (letter: LetterGrade) => number;
export type CalculateTermGpaFn = (courses: readonly CourseEntry[]) => GpaResult;
export type CalculateCgpaFn = (terms: readonly TermRecord[]) => CgpaResult;
export type CalculateFeesFn = (input: FeeInput) => FeeBreakdown;
export type CalculatePaymentScheduleFn = (
	programId: ProgramId,
	recurringDue: number,
	isFirstTerm: boolean
) => PaymentSchedule;
export type CalculateProgramTotalFn = (programId: ProgramId, waiverTier: WaiverTier) => ProgramTotal;
export type ListProgramsFn = () => readonly Program[];
export type GetProgramFn = (id: ProgramId) => Program;
```

Module surface (frozen; later tasks implement behind it): `$lib/domain/grading` exports `gradePoint: GradePointFn` and `calculateTermGpa: CalculateTermGpaFn`; `$lib/domain/cgpa` exports `calculateCgpa: CalculateCgpaFn` (T02); `$lib/domain/fees` exports `calculateFees`, `calculatePaymentSchedule`, `calculateProgramTotal`, `listPrograms`, `getProgram` (T03). Each module has a barrel `index.ts` inside its own directory.

14. `src/lib/domain/data/grading-scale.ts` (frozen data, official UIU scale):

```ts
import type { GradePointEntry } from '../contracts';

export const GRADE_POINTS: readonly GradePointEntry[] = [
	{ letter: 'A', point: 4.0, minPercent: 90, maxPercent: 100, assessment: 'Outstanding' },
	{ letter: 'A-', point: 3.67, minPercent: 86, maxPercent: 89, assessment: 'Excellent' },
	{ letter: 'B+', point: 3.33, minPercent: 82, maxPercent: 85, assessment: 'Very Good' },
	{ letter: 'B', point: 3.0, minPercent: 78, maxPercent: 81, assessment: 'Good' },
	{ letter: 'B-', point: 2.67, minPercent: 74, maxPercent: 77, assessment: 'Above Average' },
	{ letter: 'C+', point: 2.33, minPercent: 70, maxPercent: 73, assessment: 'Average' },
	{ letter: 'C', point: 2.0, minPercent: 66, maxPercent: 69, assessment: 'Below Average' },
	{ letter: 'C-', point: 1.67, minPercent: 62, maxPercent: 65, assessment: 'Poor' },
	{ letter: 'D+', point: 1.33, minPercent: 58, maxPercent: 61, assessment: 'Very poor' },
	{ letter: 'D', point: 1.0, minPercent: 55, maxPercent: 57, assessment: 'Pass' },
	{ letter: 'F', point: 0.0, minPercent: 0, maxPercent: 54, assessment: 'Fail' }
];
```

15. `src/lib/domain/data/programs.ts` (frozen data, official fee table 2026-10-23):

```ts
import type { Program } from '../contracts';

export const PROGRAMS: readonly Program[] = [
	{ id: 'bba', name: 'BBA', totalCredits: 125, perCreditFee: 6500, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bba-ais', name: 'BBA in AIS', totalCredits: 125, perCreditFee: 6500, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bseco', name: 'BSECO', totalCredits: 122, perCreditFee: 6500, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bsseds', name: 'BSSEDS', totalCredits: 123, perCreditFee: 6500, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bscse', name: 'BSCSE', totalCredits: 141, perCreditFee: 6500, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bsds', name: 'BSDS', totalCredits: 138, perCreditFee: 6500, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bseee', name: 'BSEEE', totalCredits: 140, perCreditFee: 6500, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bsc-civil', name: 'BSc Civil', totalCredits: 151.5, perCreditFee: 6500, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bpharm', name: 'B.Pharm', totalCredits: 160, perCreditFee: 6500, termSystem: 'semester', termsTotal: 8, labFeePerTerm: 5000 },
	{ id: 'ba-english', name: 'BA English', totalCredits: 123, perCreditFee: 5525, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bssmsj', name: 'BSSMSJ', totalCredits: 130, perCreditFee: 5525, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 0 },
	{ id: 'bsbge', name: 'BSBGE (BSc in Biotechnology & Genetic Engineering)', totalCredits: 140, perCreditFee: 6500, termSystem: 'trimester', termsTotal: 12, labFeePerTerm: 2000 }
];
```

16. `src/lib/domain/data/fee-rules.ts` (frozen data):

```ts
import type { FeeRules } from '../contracts';

export const FEE_RULES: FeeRules = {
	trimesterFee: 6500,
	semesterFee: 9750,
	admissionFee: 20000,
	cautionMoney: 2000,
	preRegistrationPayment: 20000,
	retakeWaiverFraction: 0.5,
	installmentPlanTrimester: [40, 30, 30],
	installmentPlanSemester: [25, 25, 25, 25],
	effectiveDate: '2026-10-23',
	gradingSourceUrl: 'https://www.uiu.ac.bd/academics/grading-performance-evaluation/',
	feesSourceUrl: 'https://www.uiu.ac.bd/admission/tuition-fees-payment-policies/tuition-fees-waiver/'
};
```

17. Grading module tracer (S1). `src/lib/domain/grading/grade-point.ts`:

```ts
import type { GradePointFn } from '../contracts';
import { GRADE_POINTS } from '../data/grading-scale';

const POINTS: ReadonlyMap<string, number> = new Map(GRADE_POINTS.map((g) => [g.letter, g.point]));

export const gradePoint: GradePointFn = (letter) => {
	const point = POINTS.get(letter);
	if (point === undefined) {
		throw new RangeError(`unknown LetterGrade: ${letter}`);
	}
	return point;
};
```

`src/lib/domain/grading/calculate-term-gpa.ts`:

```ts
import type { CalculateTermGpaFn } from '../contracts';
import { gradePoint } from './grade-point';

export function assertCredits(credits: number): void {
	if (!Number.isFinite(credits) || credits <= 0 || credits > 12 || (credits * 2) % 1 !== 0) {
		throw new RangeError('credits must be a positive multiple of 0.5, at most 12');
	}
}

export const calculateTermGpa: CalculateTermGpaFn = (courses) => {
	let totalCredits = 0;
	let earnedCredits = 0;
	let weighted = 0;
	for (const course of courses) {
		assertCredits(course.credits);
		const point = gradePoint(course.grade);
		totalCredits += course.credits;
		weighted += course.credits * point;
		if (point > 0) {
			earnedCredits += course.credits;
		}
	}
	return {
		gpa: totalCredits === 0 ? 0 : weighted / totalCredits,
		earnedCredits,
		totalCredits
	};
};
```

`src/lib/domain/grading/index.ts`:

```ts
export { gradePoint } from './grade-point';
export { calculateTermGpa } from './calculate-term-gpa';
```

18. Slice 1 (U1) at S1 — red first: write `src/lib/domain/grading/grading.test.ts` BEFORE deepening anything, run `npx vitest run src/lib/domain/grading` and capture the first-red line in your report. Tests (keep and extend):

```ts
import { describe, expect, it } from 'vitest';
import type { CourseEntry, LetterGrade } from '../contracts';
import { calculateTermGpa, gradePoint } from './index';

function course(code: string, credits: number, grade: LetterGrade): CourseEntry {
	return { id: code, code, title: '', credits, grade, isRetake: false };
}

describe('gradePoint', () => {
	it('maps official LetterGrades to their published GradePoints', () => {
		expect(gradePoint('A')).toBe(4.0);
		expect(gradePoint('A-')).toBe(3.67);
		expect(gradePoint('B+')).toBe(3.33);
		expect(gradePoint('D+')).toBe(1.33);
		expect(gradePoint('D')).toBe(1.0);
		expect(gradePoint('F')).toBe(0.0);
	});
});

describe('calculateTermGpa', () => {
	it('is the credit-weighted average of GradePoints (U1)', () => {
		const result = calculateTermGpa([
			course('CSE 1101', 3, 'A'),
			course('MAT 1109', 3, 'B+'),
			course('ENG 1103', 2, 'C')
		]);
		expect(result.gpa).toBeCloseTo(25.99 / 8, 10);
		expect(result.totalCredits).toBe(8);
		expect(result.earnedCredits).toBe(8);
	});

	it('counts an F in the average but earns no Credits for it (U1)', () => {
		const result = calculateTermGpa([course('CSE 1101', 3, 'F'), course('MAT 1109', 2, 'A')]);
		expect(result.gpa).toBeCloseTo(8 / 5, 10);
		expect(result.earnedCredits).toBe(2);
		expect(result.totalCredits).toBe(5);
	});

	it('returns zeros for an empty Planner (U1)', () => {
		expect(calculateTermGpa([])).toEqual({ gpa: 0, earnedCredits: 0, totalCredits: 0 });
	});

	it('rejects Credits that are not a positive multiple of 0.5 up to 12', () => {
		expect(() => calculateTermGpa([course('X 1000', 0.3, 'A')])).toThrow(RangeError);
		expect(() => calculateTermGpa([course('X 1000', 13, 'A')])).toThrow(RangeError);
	});
});
```

Done when: `npx vitest run src/lib/domain/grading` exits 0 with all tests passing.

19. `src/routes/+layout.ts`:

```ts
export const prerender = true;
```

20. `src/routes/+layout.svelte` (frozen header/footer; carries U9 app-wide):

```svelte
<script lang="ts">
	import '../app.css';
	import { FEE_RULES } from '$lib/domain/data/fee-rules';

	let { children } = $props();
</script>

<div class="shell">
	<header class="site-header">
		<h1>UIU Calculator</h1>
		<p class="tagline">Cgpa and tuition + registration planner for United International University Students</p>
	</header>
	<main>
		{@render children()}
	</main>
	<footer class="site-footer">
		<p>
			Fee and grading data effective {FEE_RULES.effectiveDate} · Sources:
			<a href={FEE_RULES.feesSourceUrl}>UIU Tuition Fees</a> and
			<a href={FEE_RULES.gradingSourceUrl}>UIU Grading</a>. UIU may change fees without
			notice — verify amounts with UIU before paying. Estimates are not invoices.
		</p>
	</footer>
</div>

<style>
	.shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.site-header {
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}
	.tagline {
		color: var(--color-text-muted);
		margin: var(--space-1) 0 0;
	}
	main {
		flex: 1;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--space-4);
	}
	.site-footer {
		border-top: 1px solid var(--color-border);
		padding: var(--space-3) var(--space-4);
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}
</style>
```

21. `src/routes/+page.svelte` — the tracer skeleton (T04 replaces this page with the full Planner; keep it minimal but real):

```svelte
<script lang="ts">
	import type { CourseEntry, LetterGrade } from '$lib/domain/contracts';
	import { GRADE_POINTS } from '$lib/domain/data/grading-scale';
	import { calculateTermGpa } from '$lib/domain/grading';

	const letters: readonly LetterGrade[] = GRADE_POINTS.map((g) => g.letter);
	let code = $state('CSE 1101');
	let credits = $state(3);
	let grade = $state<LetterGrade>('A');

	let result = $derived(
		calculateTermGpa([
			{ id: 'tracer', code, title: '', credits, grade, isRetake: false } satisfies CourseEntry
		])
	);
</script>

<section>
	<h2>Trimester Planner</h2>
	<p>Tracer skeleton: one Course row. Task T04 replaces this page with the full Planner.</p>
	<label>
		Course code
		<input name="code" bind:value={code} />
	</label>
	<label>
		Credits
		<input name="credits" type="number" min="0.5" max="12" step="0.5" bind:value={credits} />
	</label>
	<label>
		Grade
		<select name="grade" bind:value={grade}>
			{#each letters as letter}
				<option value={letter}>{letter}</option>
			{/each}
		</select>
	</label>
	<p aria-live="polite" data-testid="tracer-gpa">
		Term GPA: {result.gpa.toFixed(2)} · Earned credits: {result.earnedCredits}
	</p>
</section>
```

22. Slice 2 (U1) at S2 — red first: write `tests/e2e/smoke.spec.ts`, run `npx playwright install chromium` once, then `npx playwright test tests/e2e/smoke.spec.ts` and capture the first-red line before making it pass:

```ts
import { expect, test } from '@playwright/test';

test('tracer: Planner renders and computes the TermGpa (U1)', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toHaveText('UIU Calculator');
	await page.getByLabel('Course code').fill('CSE 1101');
	await page.getByLabel('Credits').fill('3');
	await page.getByLabel('Grade').selectOption('B+');
	await expect(page.getByTestId('tracer-gpa')).toContainText('Term GPA: 3.33');
	await expect(page.getByTestId('tracer-gpa')).toContainText('Earned credits: 3');
});

test('U9: the footer shows the EffectiveDate, sources and disclaimer', async ({ page }) => {
	await page.goto('/');
	const footer = page.locator('footer');
	await expect(footer).toContainText('effective 2026-10-23');
	await expect(footer).toContainText('verify amounts with UIU before paying');
});
```

Done when: `npx playwright test tests/e2e/smoke.spec.ts` exits 0 with 2 passing tests.

23. Commit `feat(foundation): scaffold SvelteKit app with frozen contract, data and tracer [T01]`, then run the full loop: `npm run verify` exits 0, and `python .jules/tools/swarm.py guard` reports clean. Fix only inside your owned paths.

24. Self-review pass (skill `code-review`): Spec axis against this Objective, the acceptance criteria and U1/U9; then Standards axis against AGENTS.md, GLOSSARY.md and ADR 0001. Fix hard findings, list leftovers with reasons in the report.

## Acceptance criteria

Each line is checkable by a command.
1. `npm ci` exits 0 using the committed `package-lock.json`.
2. `npx vitest run src/lib/domain/grading` exits 0 with at least 6 passing tests (S1).
3. `npx playwright test tests/e2e/smoke.spec.ts` exits 0 with 2 passing tests (S2, golden value `Term GPA: 3.33`).
4. `npm run verify` exits 0 (lint, format check, svelte-check, unit, e2e, production build).
5. `python .jules/tools/slop_guard.py` prints no ERROR and no WARN line for this branch.
6. `git diff --name-only origin/integration/uiu-calculator...HEAD` lists only owned paths plus `.jules/reports/T01.md`.
7. Story U1 verified by `src/lib/domain/grading/grading.test.ts` at S1 and `tests/e2e/smoke.spec.ts` at S2; story U9 verified by the footer test at S2.

## Decision defaults

- npm only (never pnpm/yarn); never run `npm audit fix` or `npm update` — versions are frozen by `.jules/deps.csv`.
- Do not `git init` (repo exists), do not create `README.md` (T05 owns it), do not create `vercel.json` (adapter-vercel needs none), do not touch `.github/**` (CI ships complete).
- If `prettier --check` flags your files, run `npm run format` limited to files you own, then re-run lint.
- Playwright installs Chromium only (`npx playwright install --with-deps chromium`).
- Tabs in source files (matching `.prettierrc` `useTabs: true`).
- If ESLint 10 or eslint-plugin-svelte 3.23.1 rejects a config shape above, read `node_modules/eslint-plugin-svelte/README.md` for the pinned version's flat-config usage and adjust inside `eslint.config.js` only; keep every rule listed.

## Fallbacks

- If `npm install` fails on engines: confirm `node --version` is >= 22.17 and retry with the same pins; never change a version. If the VM Node is older, record `[PARTIAL]` with the exact error — do not work around it.
- If the Playwright browser download fails in the VM: commit everything else, mark acceptance 3 as the gap, put `[PARTIAL]` in the PR title, and note that CI runs S2 on every PR.
- If svelte-check fails on generated `.svelte-kit` types: run `npx svelte-kit sync` first (the `check` script already does).
- If a pinned package 404s on the registry: file a request in `.jules/requests/T01-<slug>.md` naming the package and error, stop that step, continue with the rest, and report `[PARTIAL]`.

## Hand-off

Report at `.jules/reports/T01.md` (format in AGENTS.md section 10). Tell dependent tasks:
- T02: contract + data locations; `assertCredits` exported from `grading/calculate-term-gpa.ts` for reuse; grading tests to extend (do not delete).
- T03: contract types for fees are complete; `FEE_RULES` and `PROGRAMS` carry every constant; validation style (RangeError one-liners).
- T04: tokens in `src/app.css`; frozen layout provides header/footer (U9 partly done); tracer page and smoke spec are yours to replace/absorb; `data-testid` convention from the smoke spec.
- T05: script names in `package.json`; Node and Python versions from `.jules/deps.csv`.
