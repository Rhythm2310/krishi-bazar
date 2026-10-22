# T19: Integration hardening — a11y, performance, budgets

Wave: 18 | Model: default | Size: L | Mode: integrate
Branch: `jules/T19-integration-hardening` | PR title: `[T19] Integration hardening a11y performance budgets`
Skills: domain-language, tdd, code-review, pr
Serves: U14, U16 | Seams under test: S3

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
The whole product passes the competition bar as one system: the full E2E suite (~10 journeys) green including a 360px mobile project and axe assertions on all key pages; security headers hardened to a nonce-based CSP; Lighthouse budgets (Perf ≥90, A11y ≥95, BP ≥95, SEO ≥95) met on the seeded home page and then ENFORCED (the `enforce` flag flips here); global coverage gate enabled; robots/OG defaults/error pages polished.

## Context pointers
- Always: `GLOSSARY.md`; `.jules/spec.md` U14/U16 + Testing Decisions (S3 flow list) + Further Notes (competition context).
- All prior reports `.jules/reports/T*.md` and review findings — every T05/T10/T14/T18 leftover marked "left with reason" is re-examined here (fix what is in your paths; re-file requests for what is not).
- `.jules/reports/T17.md`: seeded demo data is the Lighthouse/E2E dataset.

## Owned paths (write)
e2e/**, src/hooks.server.ts, scripts/lighthouse/**, static/robots.txt, src/routes/+error.svelte, src/lib/seo/**, vitest.config.ts
Also yours: `.jules/reports/T19.md`

## Read-only inputs
everything else (read-only audit mode; fixes outside your paths go through 5.7 requests)

## Forbidden
- Any path not listed above. Weakening any test, budget or threshold to get green. Editing feature code (requests instead — exception: you own `+error.svelte` and `hooks.server.ts` outright).

## Steps
1. E2E suite completion (Slice, U14, S3, red first per missing flow): ensure these journeys exist and are green — (1) register→login→create listing w/ photo→marketplace shows it; (2) search+filter+sort+LoadMore; (3) detail→order express w/ live estimate→confirmation (total matches, farmer phone); (4) farmer accept→পথে→সম্পন্ন; (5) reject w/ reason→stock restored; (6) buyer cancel while নতুন; (7) expired-order sweep visible on dashboard; (8) comments: post→verified badge→farmer reply→rate-limit denial; (9) manage: edit→pause→hidden→resume→delete→404; (10) language toggle persists across a full journey and Bengali numerals render; (11) dark mode toggle persists; (12) 404 page. Add a `mobile` Playwright project (360×640, chromium, `testMatch: /mobile\//`) with `e2e/mobile/journey.spec.ts` covering flows 1, 3, 8 compactly. Axe assertions (zero violations) on: home, detail, confirmation, farmer dashboard, login — inside the relevant specs.
2. CSP hardening (Slice, U14, S2-adjacent — hooks unit-testable via the real `handle`): replace `script-src 'unsafe-inline'` with a per-request nonce: generate in `handle`, expose via `locals.cspNonce`, emit `script-src 'self' 'nonce-…'`; SvelteKit threads the nonce into its inline scripts automatically (pinned kit 3.0.1 — verify from its docs; the theme pre-paint script in `app.html` is static — rewrite it nonce-aware is impossible in app.html: move theme init into a nonce'd hook-injected script OR keep a sha256 hash allowlist for that one static script — choose the hash allowlist, compute at build? No: compute the hash once, hardcode in hooks with a comment, and add a unit test that hashes the app.html script content and fails if it drifts). Keep img-src blob + Vercel Blob domain; add `object-src 'none'`, `form-action 'self'`, `upgrade-insecure-requests` (production only). Tests: header present with nonce, hash matches app.html, no `unsafe-inline` in script-src.
3. SEO/static: `static/robots.txt` (allow all; no sitemap line — there is no sitemap); `src/lib/seo/default-meta.ts` (site name, default description in both locales, theme-color) consumed by `+error.svelte` and available to pages (T12 already sets per-listing meta — do not touch it); `+error.svelte` polish: localized 404/500 with brand illustration (inline SVG), status-aware copy, way home; assert `<title>` and meta description exist on home/detail/404 (add SEO checks to e2e flow 12 area).
4. Lighthouse: seed the DB, `bun run lh` against the seeded home; fix regressions **within your paths** (font preload link is app.html — request if needed; image dims are feature files — request if missing; meta description via seo defaults you own). Iterate until budgets pass, then create the empty file `scripts/lighthouse/enforce` (this flips CI enforcement) and re-run `bun run lh` to prove enforced mode passes. Extend `scripts/lighthouse/check.ts` to run THREE pages when seeded (home, one seeded listing detail via a stable seeded id from T17's deterministic plan, login) and require budgets on all three.
5. Global coverage gate: in `vitest.config.ts` add the include-scope (`src/lib/**`) global thresholds: 85% statements, 85% branches (domain-specific 95/95 stays). If the suite is below, raise coverage by adding tests ONLY in your owned e2e→? — unit coverage gaps belong to their modules: file requests with the exact gap list; meanwhile set the global gate to the current floor minus 2 points ONLY IF ≥80, and record the exact numbers + filed requests in the report (no silent weakening below 80 — stop and report `[PARTIAL]`).
6. Reduced-motion + focus audit: verify tokens' reduced-motion rule holds on the toggle-heavy flows (e2e: emulate `prefers-reduced-motion: reduce` in the mobile project for flow 10); focus visible after every dialog/toggle interaction (axe covers most; add two explicit focus assertions).
7. Self-review pass (skill `code-review`): Spec then Standards — the suite is the product's proof: no skipped tests, no `.only`, budgets enforced, nonce CSP complete.

## Acceptance criteria
1. `bun run test:e2e` green: all ~12 desktop flows + mobile project + zero axe violations on the five listed pages.
2. `bun run lh` green WITH `scripts/lighthouse/enforce` present, on home + seeded detail + login.
3. CSP: `curl -sI` shows `script-src 'self' 'nonce-` (or hash) and no `unsafe-inline` for scripts; nonce-drift test green.
4. Global coverage gate active in `vitest.config.ts` at ≥85/85 include-scope (or the documented `[PARTIAL]` floor with filed requests).
5. `bun run verify` passes and `python .jules/tools/slop_guard.py --strict` reports no ERROR and no new WARN.

## Decision defaults
- E2E data: each spec seeds what it needs via the globalSetup helper (T11 mechanism) — specs never depend on T17's demo rows except the Lighthouse detail page (stable seeded id).
- Nonce + static-script hash allowlist is the chosen CSP shape (documented above); no third-party origins exist, so the CSP stays tight.
- Lighthouse runs mobile form factor, throttling defaults, 1 run per page (median of 1 — budgets have ≥5 points of headroom by design).

## Fallbacks
- If a Lighthouse budget misses by ≤3 points due to runner variance, re-run twice and take the median; if it still misses, fix the top audit item and re-run — do not lower budgets.
- If Playwright's chromium lacks a codec for the PNG→WebP fixture flow in this VM, keep the fixture PNG (browser-side conversion is chromium-native since 112 — verify the installed version and record it).

## Hand-off
Report at `.jules/reports/T19.md`. For T20: screenshot capture should reuse the seeded DB; budgets are enforced — README can state them as guarantees. For T21: the enforce flag + coverage floor decision are audit points.
