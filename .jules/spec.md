# Spec: Krishi Bazar v2

Architect-owned. Agents read it; they never edit it. User stories are `U<n>`, seams are `S<n>`. Task files cite both.

## Problem Statement
Bangladeshi farmers lose income to middlemen, and buyers cannot verify how fresh produce actually
is. The legacy prototype proved the concept but cannot go to production: it exposes every buyer's
phone and address on a public orders page, computes money with floating point, can oversell stock
under concurrent orders, stores data in SQLite and photos on a local disk (impossible on Vercel),
has no authentication, no validation, no tests, no CI, Bangla-only text, one unit (kg), and a
naive freshness badge. The owner wants a competition-grade, professional, clean rebuild with no
bloat.

## Solution
A bilingual (Bangla default, English switchable) mobile-first marketplace where farmers register
with a Bangladeshi mobile number and password, list harvests under a comprehensive
Bangladesh-specific taxonomy with grade, organic claim, unit, photos and harvest date, and receive
an advisory Fair price they can accept or override. Buyers browse, search, filter and order as
guests; stock is reserved atomically; payment is cash-on-delivery with direct phone contact.
Farmers process orders through a strict lifecycle with automatic expiry. Comments carry a
Verified-buyer badge and one-level farmer replies, rate-limited per IP. Freshness is computed from
real-world per-category shelf-life windows pinned to Asia/Dhaka. Deployed on Vercel (Bun runtime),
Neon Postgres free tier, Vercel Blob.

## User Stories
1. **U1**: As a Buyer, I want to browse available Listings with freshness, grade and organic badges, price with unit conversion, and farmer District, so that I can trust what I am buying at a glance.
2. **U2**: As a Buyer, I want to search by name and filter by Group/Category, Grade, Organic claim and District, sort by newest harvest or price, and page through results, so that I find what I need in a large marketplace.
3. **U3**: As a Buyer, I want a Listing detail page with all photos, the best-before date, stock, and the Farmer's contact, so that I can decide and negotiate directly.
4. **U4**: As a Buyer, I want to order any allowed quantity with a Delivery speed as a guest, see a live total estimate that matches the server-computed total exactly, and get a confirmation with the Farmer's phone, so that ordering is simple and honest.
5. **U5**: As a Buyer, I want to cancel my Order while it is still নতুন, so that I am not committed to a mistake.
6. **U6**: As a Buyer, I want to comment on a Listing with my name and optional phone, see Verified-buyer badges, and never see spam floods, so that I can judge produce from real purchasers.
7. **U7**: As a Farmer, I want to register with my Bangladeshi mobile number and a password, log in and log out, and know my dashboard is private, so that nobody can touch my Listings or Orders.
8. **U8**: As a Farmer, I want to create a Listing with Category, Unit, Stock, Grade, Organic claim, harvest date, District plus village, up to three WebP photos, and a price — seeing an advisory Fair price with its reason and applying it in one tap or setting my own freely — so that I price confidently without being forced.
9. **U9**: As a Farmer, I want to edit, pause, resume and delete my own Listings and see their stock and order counts, so that my storefront stays accurate.
10. **U10**: As a Farmer, I want to see only my received Orders with buyer contact details, accept, reject with a reason, mark পথে and সম্পন্ন, and have unaccepted Orders expire automatically after 24 hours with Stock released, so that I never oversell and buyers never wait on a dead order.
11. **U11**: As a Farmer, I want to reply once to any Comment on my Listings with a কৃষক badge, so that I can answer questions publicly.
12. **U12**: As any visitor, I want to switch Bangla/English instantly without reload, have my choice remembered, and see numbers and dates formatted for my Locale, so that the product feels native in both languages.
13. **U13**: As any visitor, I want dark and light themes following my system preference with a manual override, so that the site is comfortable day and night.
14. **U14**: As any visitor, I want fast, accessible, mobile-first pages with polished empty states, proper 404/500 pages and no layout jank, so that the product feels professional.
15. **U15**: As a developer, I want `bun install && bun run db:reset && bun run db:seed && bun run dev` to give me a fully working marketplace with season-realistic demo data and zero external services, so that onboarding and judging are frictionless.
16. **U16**: As the operator, I want to deploy to Vercel Hobby with Neon free Postgres and Vercel Blob by setting documented environment variables, so that production runs at zero cost.

## Implementation Decisions
Runtime and platform (ADR-0001): Bun is the single toolchain — package manager (`bun.lock`), dev,
tests, build; production runs on Vercel Functions with the Bun runtime (adapter `runtime` set to
the Bun value; `bunVersion` 1.4.x in `vercel.json`; Beta on Vercel — recorded as a risk). Code
under `src/` stays runtime-agnostic (web standards + `node:crypto`), so switching the adapter
runtime to `nodejs24.x` is a one-line fallback. Function region `bom1`. SvelteKit 3, Svelte 5,
TypeScript strict, `@sveltejs/adapter-vercel` 7 — exact versions only from `.jules/deps.csv`.

Money and quantity (ADR-0002): every money value is an integer number of Paisa; quantities are
decimals in the Listing's Unit (kg and maund 2 decimals, litre 2 decimals, count units integers).
Order totals — goods plus delivery surcharge — are computed only by one pure pricing function on
the server; the browser renders the same pure function for the live estimate. Display converts
Paisa to Taka per Locale (Bengali numerals in `bn`).

Execution model (ADR-0003): tasks run strictly sequentially, one Jules agent at a time.

Database: Neon Postgres (free tier) in production via the serverless HTTP driver; PGlite
(embedded WASM Postgres, officially Bun-compatible) for local dev and all automated tests, chosen
by one env var through a Drizzle adapter seam. Drizzle ORM with SQL migrations committed to the
repo. Tables: Farmer, Session, Listing, Order, Comment (self-referencing for the single farmer
reply level), IpEvent (rate-limit windows). Taxonomy, Units, Districts, seasons, shelf-life
windows, average piece weights and reference prices live in versioned code data modules — never
in the database — each cell editable and covered by tests. Stock is reserved with a single atomic
conditional UPDATE at Order creation and released at any terminal transition; an oversell race is
a named test.

মাণ decision: 1 মণ = **40 kg** — the live Bangladesh bazaar convention (Wikipedia records 40 kg
throughout Bangladesh; the historical metric maund is 37.3242 kg). The constant lives in one data
module, is documented in both units UI copy and code comment, and switching it is a one-cell edit.

Categories: two-level taxonomy — 9 Groups, ~100 Categories — as approved in the grill, each with
Bangla and English names, allowed Units, shelf-life window (prime/ok days), season months and
average piece weights where count-units apply.

Freshness: computed server-side from harvest date against the Category window, Asia/Dhaka pinned.
States: harvested today (special), prime (তাজা), ok (amber), past (red + check-before-order hint);
the detail page and cards show a best-before date = harvest + ok days.

Fair price: pure function over Category reference price (sourced from DAM daily market reports and
the AgriPriceBD dataset, recorded with provenance in the data module), season-month multipliers,
Grade and Organic-claim factors, Unit, and — once a Category has ≥5 completed Orders — a blend
toward the platform's own median. Returns min/fair/max in Paisa plus a one-line human reason in
both Locales. Advisory only: the Farmer's manual price always wins; no validation ties the price
to the advice.

Delivery: two speeds (express 1 day, standard 3 days) charging per-kg surcharges over the Order's
kg-equivalent mass (mass/litre units convert directly with densities; count units via Category
average weights). Rates live in one config module. No live courier integration.

Orders lifecycle: নতুন → গৃহীত → পথে → সম্পন্ন; terminal বাতিল via farmer rejection (reason enum:
stock-out, wrong price, other), buyer cancellation while নতুন, or 24-hour auto-expiry evaluated
lazily on every read (no cron). Every invalid transition is rejected. Buyer phone and address are
visible only to the owning Farmer and on the buyer's own confirmation; a Buyer cannot order with
the Farmer's own phone number. Cash-on-delivery only; no payment gateway; no notifications —
the dashboard and confirmation page are the channels.

Auth: Farmer accounts — normalized BD mobile (01[3-9]XXXXXXXX) + password hashed with scrypt
(`node:crypto`), opaque session tokens in the Session table, httpOnly SameSite=Lax secure cookies,
30-day absolute expiry. Open registration, no admin role, no password reset in v1 (accepted risk;
the session module is the documented seam for future OTP/reset). Guests never hold sessions.

Photos: 1–3 per Listing, WebP only. The browser converts and downscales (canvas → WebP, ≤1600px
long edge, quality ≈0.82, ≤2MB) with feature detection and a localized error for browsers that
cannot encode WebP; upload goes direct to Vercel Blob via the handleUpload token flow (the token
route is auth-gated and IP-rate-limited). The server re-validates type and size at token issue;
displayed images degrade to a local placeholder on decode failure. No hotlinked stock images.

Comments: guests post name + optional phone; DB-backed sliding-window rate limit per IP (3/hour,
10/day) using IpEvent, honeypot field, length caps, newest first; Verified-buyer badge computed at
read time when the phone matches a non-cancelled Order on the same Listing; the owning Farmer may
post exactly one reply per Comment, badged কৃষক.

i18n: typed message dictionaries for `bn` (default) and `en` as per-module drop-in files; instant
cookie-backed toggle, no reload, no URL prefixes; `Intl` number/date formatting per Locale;
`<html lang>` updates; CI test asserts key parity across Locales. Farmer-entered content is never
translated.

Design system: hand-written CSS only — a token layer (OKLCH palette grown from the brand emerald
and amber, type scale, spacing, radii, elevation, motion), a base/reset layer, then scoped
component styles; dark theme by token swap driven by `prefers-color-scheme` plus a manual toggle
persisted in a cookie; self-hosted Hind Siliguri (bn) and Inter (en); `@lucide/svelte` icons;
mobile-first; AA contrast, visible focus, reduced-motion respected. No CSS framework, no CDNs, no
third-party runtime requests.

Marketplace scale: keyset (cursor) pagination on (harvest date, id), 24 per page; ILIKE name
search; filters for Group/Category, Grade, Organic, District (structured 64-district dropdown +
free-text village); sorts: newest harvest (default), price ascending, price descending. Only
active Listings with stock are shown; paused, deleted and zero-stock Listings are hidden.

Validation: one zod schema set shared by client and server; every form action re-validates
server-side and returns field-level errors in the active Locale. Bounds: price ১–১,০০,০০০ ৳ per
unit; stock 0.5–10,000 mass/litre or 1–10,000 count; harvest date ≤ today and not older than
twice the Category ok-window; name ≤120 chars; description ≤1000; address ≤500; comment ≤600.

Security: security headers (CSP, X-Content-Type-Options, Referrer-Policy, X-Frame-Options,
Permissions-Policy) applied in one server hook; parameterized SQL everywhere via Drizzle;
rate limits on auth, order, comment and upload-token endpoints; secrets only via env vars.

Ops: `/api/health` returns JSON status; custom bilingual 404/500 pages; dev-only season-aware seed
(current month drives which Categories appear — ইলিশ peaks in আশ্বিন, আম is absent, খেজুর গুড়
arrives in পৌষ); competition-grade bilingual README with screenshots, architecture overview,
setup and deployment guides; `robots.txt`; OG/meta per Listing; MIT license.

## Testing Decisions
What a good test is here: external behaviour observed through a public interface — a domain
function's output, an HTTP-level request/response plus resulting database state, or a browser
journey. Never implementation details; never component internals.

Seams (highest possible; agents test only here):
- **S1**: Domain modules — every pure rule: Paisa arithmetic and rounding, Unit conversions and
  kg-equivalents, Freshness states and boundaries per Category, Fair-price outputs and reasons,
  the Order state machine (every legal and illegal transition), validation schemas, rate-limit
  windows, Verified-buyer matching, Locale formatting and dictionary parity. Includes
  property-based tests: money never drifts more than one Paisa, stock is conserved across random
  order/cancel/expire sequences, fair price is monotonic in Grade and bounded by min/max.
- **S2**: Server surface — every form action and API endpoint driven in-process against a
  disposable PGlite database: auth registration/login/logout and session expiry, farmer-only
  authorizations, every validation denial, order creation with atomic reservation, the parallel
  oversell race (two concurrent orders, last one fails), lazy expiry recomputation and restock,
  comment rate limiting and badge computation, upload token issuance rules, listing
  pause/delete/edit ownership.
- **S3**: Browser E2E (Playwright + axe-core) against the built app on PGlite: register → login →
  create listing with photo → appears in marketplace → buyer searches/filters → orders with speed
  and manual price context → confirmation shows farmer phone → farmer accepts → পথে → সম্পন্ন;
  reject-with-reason restocks; buyer cancels a নতুন order; comment + verified badge + farmer
  reply; language toggle persists and reformats numbers; dark mode toggle; 404 page; axe
  violations zero on key pages; one pass at 360px width.

Modules tested: all domain modules (gate: ≥95% statements and branches), all route server logic,
overall coverage ≥85% — enforced in CI. Prior art in the repo: none (greenfield); the foundation
task establishes the S1/S2/S3 harness patterns every later task copies.

## Out of Scope
Online payment and payment gateways; SMS/email/push notifications; password reset and account
recovery (seam documented); admin or moderation dashboards; buyer accounts and buyer order
history; URL-prefixed locales and machine translation of farmer content; partial order
fulfillment; region-specific price factors (seam documented); organic certification verification;
native mobile apps; multi-currency; courier tracking integrations; listing auto-archiving.

## Further Notes
Competition context: judges clone the repo and click the deployed URL — README quality, seed-data
realism, Lighthouse budgets (Perf ≥90, A11y ≥95, Best-Practices ≥95, SEO ≥95) and the bilingual
toggle are first-class deliverables, not afterthoughts.
Reference-price provenance: DAM daily market reports (market.dam.gov.bd) and the AgriPriceBD
public dataset; where no published retail figure exists for a Category, the seed value is a
documented estimate — every cell of the reference table is owner-editable without touching code.
Neon free tier scales to zero after 5 minutes: the first request after idle pays a cold start —
accepted for v1.
Vercel Blob Hobby-plan quota: verify remaining storage in the dashboard before the demo.
All user-facing strings must come from the dictionaries; hardcoded text fails review.
Glossary terms are binding in code identifiers, test names, task files and UI copy.
