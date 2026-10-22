# T02: Design system app shell and i18n core

Wave: 1 | Model: default | Size: M | Mode: foundation
Branch: `jules/T02-design-shell` | PR title: `[T02] Design system app shell and i18n core`
Skills: domain-language, tdd, codebase-design, code-review, pr
Serves: U12, U13, U14 | Seams under test: S3

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
The product looks and feels like the competition-grade brand: a token-driven pure-CSS design system (emerald/amber, light+dark), the app shell (header with nav, language toggle, theme toggle; footer), the complete i18n core (typed bn/en dictionaries with drop-in auto-merge, cookie-backed instant switching, Intl formatters incl. Bengali numerals), localized 404/500 pages, and the home skeleton. After this task every later UI has tokens, primitives and two languages to build on.

## Context pointers
- Always: `GLOSSARY.md` (Locale, Freshness tones); `.jules/spec.md` stories U12–U14 and the Design-system + i18n decisions.
- From T01 (`.jules/reports/T01.md`): cookie names `kb_theme`/`kb_locale`, `locals.locale`, pre-paint theme script in `src/app.html`.
- When choosing colors: AA contrast is an acceptance criterion, not a goal.

## Owned paths (write)
src/styles/**, src/lib/i18n/**, src/lib/components/ui/**, src/lib/components/layout/**, src/routes/+layout.svelte, src/routes/+layout.ts, src/routes/+layout.server.ts, src/routes/+page.svelte, src/routes/+error.svelte, e2e/shell.spec.ts
Also yours: `.jules/reports/T02.md`

## Read-only inputs
src/app.html, src/hooks.server.ts, src/app.d.ts, src/lib/test/**, package.json (fontsource + lucide deps are installed)

## Forbidden
- Any path not listed above; `src/app.html` and `hooks.server.ts` stay as T01 shipped (requests via 5.7 if blocked).
- CSS frameworks, CDN links, raw hex colors in components (tokens only), new dependencies.

## Steps
1. `src/styles/tokens.css` (frozen contract after this task): CSS custom properties — OKLCH brand palette (emerald primary scale 50–900 from the legacy #2e7d32 family, amber accent scale), semantic tokens for light and dark (`[data-theme="dark"]` block): surface, surface-raised, text, text-muted, border, focus-ring, and status tones good/mid/old mapped to the Freshness badge states; 4px spacing scale; type scale tuned for Hind Siliguri; radii; elevation shadows; motion durations/easings; `prefers-reduced-motion` zeroing motion. `src/styles/base.css`: minimal modern reset, body defaults, `:focus-visible` ring, selection color. Import both plus `@fontsource/hind-siliguri` (400,600,700) and `@fontsource-variable/inter` in the root layout; font-family switches with locale (`bn` → Hind Siliguri first, `en` → Inter first). Done when: both themes render the skeleton with AA contrast (verify text/surface pairs ≥ 4.5:1 — compute, don't eyeball).
2. i18n core `src/lib/i18n/index.ts` (frozen contract): `type Dict` built from `import.meta.glob('./{bn,en}/*.ts', { eager: true })` auto-merge per locale; `t(key, params?)` with `{param}` interpolation, missing key → throws in dev/test, renders the key in prod; locale store hydrated from `locals.locale`; `setLocale(l)` writes cookie `kb_locale` (1y, path=/, SameSite=Lax) and updates the store + `document.documentElement.lang` instantly, no reload. Seed dictionaries `bn/common.ts` + `en/common.ts` (brand, nav, actions, theme labels, 404/500 copy, empty states). Done when: switching locale re-renders every common string and survives reload.
3. `src/lib/i18n/format.ts` (frozen contract): `formatTaka(paisa, locale)` → `৳১,২৩৪` (bn-Bengali numerals, lakh grouping via `Intl.NumberFormat('bn')`) / `৳1,234` (en); `formatNumber(n, locale)`; `formatQty(qtyHundredths, unitId, locale)` (trims trailing zeros); `formatDate(iso, locale)` (`Intl.DateTimeFormat`, bn → Bangla month names). All money display goes through `formatTaka` (ADR-0002). Done when: unit-tested inline via shell spec assertions in step 6.
4. UI primitives `src/lib/components/ui/`: Button (variants primary/secondary/danger/ghost, sizes, loading state), Field (label + input + error slot, wires aria-invalid/aria-describedby), Textarea, Select, Badge (tones: good/mid/old/brand/neutral), Card, EmptyState (icon slot + title + hint + action slot), Skeleton (shimmer respecting reduced-motion). Scoped CSS consuming tokens only. Done when: each primitive renders in both themes with visible focus states.
5. Layout shell: `src/lib/components/layout/` AppHeader (inline-SVG brand mark + wordmark from `common` dict, nav: marketplace `/`, farmer area `/farmer` — link only, pages come later tasks; LanguageToggle bn/en segmented control; ThemeToggle light/dark/system tri-state writing `kb_theme` cookie + `data-theme`), AppFooter (brand line, glossary-powered tagline, no dead links). `+layout.svelte` composes them; `+layout.server.ts` passes `locals.locale`. `+page.svelte`: hero (anti-middleman promise line from the legacy brand: দালালমুক্ত সরাসরি কৃষক-ক্রেতা প্ল্যাটফর্ম / "Direct farmer-to-buyer, no middlemen") + EmptyState for listings (T11 replaces the page body with the marketplace). `+error.svelte`: localized 404 and 500 states with a way home. Done when: shell renders bn/en, dark/light, 360px-wide without horizontal scroll.
6. `e2e/shell.spec.ts` (Slice, S3, red first per behaviour): home shows brand; language toggle switches nav text without reload; locale persists across navigation and full reload (cookie); `formatTaka` output visible somewhere on home in bn shows Bengali numerals (assert `৳` + a `[০-৯]` char); theme toggle sets `data-theme` and persists after reload; unknown URL shows localized 404 text in the active locale; axe-core: zero violations on home in both locales. Done when: `bunx playwright test e2e/shell.spec.ts` green.
7. Self-review pass (skill `code-review`): Spec then Standards; check every string lives in both dictionaries.

## Acceptance criteria
1. `bunx playwright test e2e/shell.spec.ts` green (toggle persistence, numerals, 404, axe).
2. No raw color literals outside `src/styles/tokens.css`: `grep -rEn "#[0-9a-fA-F]{3,8}|oklch\(" src/lib/components src/routes | grep -v tokens` prints nothing.
3. Every `t()` key used exists in both `bn/` and `en/` files (add a vitest parity check inside `src/lib/i18n/parity.test.ts` that globs both locales and diffs key sets — this test is the CI key-parity gate).
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Dictionary keys: `module.snake_case` (e.g. `common.nav_market`); modules add their own files (drop-in registry, AGENTS 5.6).
- Toggles write cookies with `path=/; SameSite=Lax; max-age=31536000`; theme `light|dark|system`.
- Icons: `@lucide/svelte` only; decorative icons get `aria-hidden`.
- Mobile-first: base styles target 360px; enhance upward.

## Fallbacks
- If `import.meta.glob` typing fights TS strict, type the glob result as `Record<string, { default: Dict }>` explicitly — keep auto-merge.
- If a fontsource import breaks the Vercel build, import the CSS files from `+layout.svelte` `<style>`-adjacent script instead of app.html and note it.

## Hand-off
Report at `.jules/reports/T02.md`. For all later UI tasks: primitives list + token names; `t()`/formatters are the only sanctioned text path; parity test will fail PRs with one-locale strings. For T11: `+page.svelte` hero/EmptyState structure is yours to replace.
