# T06: Farmer auth — registration, login, sessions

Wave: 5 | Model: default | Size: M | Mode: feature
Branch: `jules/T06-farmer-auth` | PR title: `[T06] Farmer auth registration login sessions`
Skills: domain-language, tdd, code-review, pr
Serves: U7 | Seams under test: S1, S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
A Farmer registers with a Bangladeshi mobile number and password, logs in and out, and every `/farmer/**` page is gated by a server-side session. Passwords are scrypt-hashed, sessions are opaque tokens stored hashed, cookies are httpOnly/SameSite=Lax/Secure, and auth endpoints are IP-rate-limited. Buyers remain guests — nothing here creates buyer identity.

## Context pointers
- Always: `GLOSSARY.md` (Farmer, Session); `.jules/spec.md` story U7 + Auth decisions.
- `.jules/reports/T05.md`: findings that touch auth or hooks — honor them.
- Contracts you consume: `src/lib/domain/validate.ts` (register/login/phone schemas), `src/lib/domain/rate-limit.ts` (auth window 5/hr), `src/lib/db/schema.ts` (farmers, sessions), `src/lib/data/rates.ts` (session lifetime).

## Owned paths (write)
src/lib/server/auth/**, src/lib/i18n/bn/auth.ts, src/lib/i18n/en/auth.ts, src/routes/farmer/+layout.server.ts, src/routes/farmer/+page.svelte, src/routes/farmer/register/**, src/routes/farmer/login/**, src/routes/farmer/logout/**, src/lib/components/auth/**, src/hooks.server.ts, e2e/auth.spec.ts
Also yours: `.jules/reports/T06.md`

## Read-only inputs
src/lib/domain/**, src/lib/db/**, src/lib/i18n/index.ts + format.ts, src/lib/components/ui/**, src/app.d.ts

## Forbidden
- Any path not listed above. `src/app.d.ts` already declares `locals.farmer` — fill it from hooks, don't re-declare.
- Storing raw tokens or plaintext/scrypt-less hashes; client-side-only gating; new dependencies.

## Steps
1. `src/lib/server/auth/password.ts` (Slice, U7, S1, red first): `hashPassword(pw)` → `scrypt$16384$8$1$<saltB64>$<hashB64>` via `node:crypto` scryptSync (16-byte random salt, keylen 64); `verifyPassword(pw, stored)` parses the params from the stored string and uses `timingSafeEqual`. Tests: round-trip, wrong password, tampered format rejected, two hashes of one password differ (salt).
2. `src/lib/server/auth/phone.ts` (S1): `normalizePhone(input)` per `domain/validate` phoneSchema → `01XXXXXXXXX` or throws the schema's keyed error. Tests: `+880`, `880`, `01` prefixes, rejects `012…`, rejects 9/12-digit.
3. `src/lib/server/auth/session.ts` (S1+S2): `createSession(db, farmerId)` → 32-byte `crypto.randomBytes` base64url token, stores sha256 hex with 30-day expiry (rates.ts), returns token; `readSession(db, token)` → farmer row or null, treats expired as null and deletes it; `destroySession(db, token)`. Cookie helper: `sessionCookie(token)` httpOnly, SameSite=Lax, Secure in production (`import { dev } from '$app/environment'`), path=/, max-age = lifetime. Tests via `withTestDb`: create→read round-trip, expiry enforced (insert backdated), destroy invalidates, raw token never appears in the sessions table (assert stored id = sha256 hex).
4. `src/hooks.server.ts` deepening: after T01's headers/locale, resolve `locals.farmer` from the `kb_session` cookie via `readSession` (single query; null when absent). Keep hooks thin — all logic stays in `lib/server/auth`. Done when: an authenticated request sees `locals.farmer` (prove in an S2 test through the real `handle`).
5. Registration (Slice, U7, S2, red first): `/farmer/register` page (Field primitives, phone + password + confirm, localized errors, link to login) and `+page.server.ts` action: rate-limit kind `auth` (5/hr/IP via `rate-limit.ts` + ip_events), validate with registerSchema, normalize phone, reject duplicate with keyed field error on phone, hash, insert farmer, create session, set cookie, redirect `/farmer`. Tests: happy path sets cookie + row exists; duplicate phone → fieldErrors.phone; 6th attempt in an hour → keyed rate-limit error; weak inputs rejected per schema.
6. Login + logout (Slice, U7, S2): `/farmer/login` with `returnTo` param (must start with `/` and not `//` — else fall back to `/farmer`; open-redirect test), same rate limit (kind `auth`), verifyPassword, session cookie, redirect returnTo. `/farmer/logout` POST-only action destroys session and clears the cookie. Tests: wrong password → keyed error and no session row; returnTo honored; `//evil.com` rejected; logout clears.
7. Gate: `src/routes/farmer/+layout.server.ts` — no `locals.farmer` → redirect(`/farmer/login?returnTo=<url.pathname>`). `src/routes/farmer/+page.svelte` — dashboard home: greeting with the Farmer's phone (formatted), member-since date (formatDate), logout button (POST), and a card list of the farmer area that later tasks fill (render links only to routes that exist now: none yet — show the localized "your tools appear as they ship" state ONLY IF no route exists; from T09 onward this page is deepened — keep the component structured for that with a `<slot>`-free explicit section list). Tests (S2): unauthenticated GET /farmer redirects to login; authenticated sees phone.
8. `e2e/auth.spec.ts` (Slice, U7, S3): register a new farmer through the UI → lands on /farmer with the phone visible; logout → /farmer now redirects to login; login with wrong password shows the localized error; login succeeds and returnTo lands back. Runs on PGlite with a fresh DB (webServer per playwright config).
9. Dictionaries `bn/en/auth.ts`: every string from steps 5–8 in both locales (parity test enforces).
10. Self-review pass (skill `code-review`): Spec then Standards — confirm no secrets in logs/reports, timing-safe compare used, cookie flags exact.

## Acceptance criteria
1. `bun run test:unit -- src/lib/server/auth` green (password, phone, session suites).
2. Story U7 verified by `src/lib/server/auth/actions.test.ts` at S2 (register/login/logout/guard/rate-limit) and by `e2e/auth.spec.ts` at S3.
3. `grep -rn "scryptSync\|timingSafeEqual" src/lib/server/auth` shows hashing only in password.ts.
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Password minimum 8 characters, maximum 200; no complexity rules (rural-UX decision recorded in the spec grill).
- Session token cookie name: `kb_session`. One session per login; multiple devices = multiple rows (allowed).
- Rate-limit denials return the same keyed-error shape as validation failures (fieldErrors with a form-level key), HTTP 200 with the form re-rendered (progressive enhancement), never a bare 429 HTML page.
- `ip_events.ip_hash` uses `domain/rate-limit.hashIp`.

## Fallbacks
- If reading the client IP is unreliable behind Vercel (`x-forwarded-for` first entry), use it when present, else `request.headers.get('x-real-ip')`, else `'local'` — record which path tests exercised.
- If the duplicate-phone race matters (two concurrent registers), rely on the DB unique constraint and map its error to the keyed field error.

## Hand-off
Report at `.jules/reports/T06.md`. For T07: `locals.farmer` is the upload gate; reuse `rate-limit` + `ip_events` with kind `upload`. For T09/T13/T16: the `/farmer` gate layout exists — nest authenticated pages under it. For T16: `/farmer/+page.svelte` dashboard is deepened by you later (listed in your owns).
