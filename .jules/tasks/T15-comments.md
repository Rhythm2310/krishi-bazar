# T15: Comments, verified badges and farmer replies

Wave: 14 | Model: default | Size: M | Mode: feature
Branch: `jules/T15-comments` | PR title: `[T15] Comments verified badges and farmer replies`
Skills: domain-language, tdd, code-review, pr
Serves: U6, U11 | Seams under test: S1, S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
Guests comment on Listings (name required, phone optional) under a DB-backed per-IP sliding-window rate limit with a honeypot; comments whose author phone matches a non-cancelled Order on the same Listing carry the Verified-buyer badge computed at read time; the owning Farmer posts exactly one reply per comment, badged কৃষক. The section mounts on the detail page, newest first, fully bilingual.

## Context pointers
- Always: `GLOSSARY.md` (Comment, Verified buyer); `.jules/spec.md` U6/U11 + Comments decisions.
- Contracts: `src/lib/domain/rate-limit.ts` (windows: comment 3/hr + 10/day), `src/lib/domain/validate.ts` (commentSchema), `src/lib/db/schema.ts` (comments incl. the single-reply unique partial index, ip_events), `.jules/reports/T13.md` (orders table for badge matching).

## Owned paths (write)
src/routes/p/[id]/**, src/lib/server/comments/**, src/lib/components/comments/**, src/lib/i18n/bn/comments.ts, src/lib/i18n/en/comments.ts, e2e/comments.spec.ts
Also yours: `.jules/reports/T15.md`

## Read-only inputs
src/lib/domain/**, src/lib/db/**, src/lib/components/{ui,listings/detail}/**, src/lib/i18n/{index,format}.ts, src/routes/p/[id]/+page.server.ts current state (you deepen it)

## Forbidden
- Any path not listed above. Storing verified status as a column (it is computed at read); any comment mutation without a rate-limit check; editing T12/T13 behaviour inside `p/[id]` beyond mounting the section (their tests must stay green).

## Steps
1. `src/lib/server/comments/list.ts` (Slice, U6, S2, red first): `listComments(db, listingId)` → top-level comments newest first, each with its farmer reply (if any) nested, and `verified: boolean` computed per comment: `author_phone` normalized non-null AND exists an order on this listing with `buyer_phone = author_phone AND status != 'cancelled'`. One query with a LEFT JOIN + EXISTS (no N+1 — assert query count via a spy or single-round-trip SQL shape). Tests: ordering; reply nesting; verified true/false matrix (matching phone non-cancelled ✓; matching phone but cancelled ✗; no phone ✗; phone of another listing's order ✗); phone normalization on both sides (comment `+880…` vs order `01…` matches).
2. `src/lib/server/comments/create.ts` (Slice, U6, S2, red first): `createComment(db, { listingId, form, ip })` → honeypot field `website` non-empty → return `{ ok: true }` WITHOUT inserting (silent drop); rate-limit kind `comment` (3/hr AND 10/day windows — both enforced via ip_events + `windowAllowed`); validate commentSchema (name ≤80, body ≤600, optional phone normalized); insert with `ip_hash`. Tests: happy insert + ip_event row; 4th comment within the hour denied (keyed error + retryAfter copy); 11th within a day denied even when spread across hours (seed timestamps); honeypot leaves zero rows and reports success; body 601 chars rejected; invalid phone rejected.
3. `src/lib/server/comments/reply.ts` (Slice, U11, S2): `replyToComment(db, { listingId, commentId, farmerId, body })` → 404-class unless the listing belongs to farmerId; parent must exist, belong to the listing, and be top-level; the unique partial index rejects a second farmer reply (map the DB error to a keyed error); stores farmer_id + parent_id. Tests: owner replies once ✓; second reply rejected; non-owner rejected; reply-to-reply rejected; cross-listing parent rejected.
4. Wire into `src/routes/p/[id]/+page.server.ts`: load adds `comments` (step 1) and `canReply` (session farmer owns listing); actions `?/comment` and `?/reply` (both re-run `expireStaleOrders`? — no: keep loads as T13 left them; only add comments data) with keyed-error redisplay preserving the draft body. Mount `<CommentSection>` after the description block (T12's hand-off point).
5. `src/lib/components/comments/`: CommentSection.svelte (count header via dictionary, list, guest form), CommentItem.svelte (author, VerifiedBadge when verified — shield icon + localized `comments.verified_buyer` with an explanatory `title`, relative-free absolute `formatDate` timestamp, body `pre-line`, nested FarmerReply with কৃষক badge, reply toggle visible only when `canReply` and no reply yet), CommentForm.svelte (name, optional phone with its purpose hint — "অর্ডারকৃত পণ্য হলে যাচাইকৃত ব্যাজ পাবেন", body textarea with counter, hidden `website` honeypot input (`tabindex=-1 aria-hidden autocomplete=off`), localized rate-limit error with retry-after minutes).
6. `e2e/comments.spec.ts` (Slice, U6+U11, S3, red first): seed listing + one delivered order (buyer phone 01799…) via globalSetup; guest posts with that phone → badge appears; guest posts without phone → no badge; farmer logs in → replies → কৃষক badge + reply nested; posting 4 comments quickly → 4th shows the localized rate-limit error (drive with real requests, no clock mocking).
7. Dictionaries `bn/en/comments.ts`. Parity enforced.
8. Self-review pass (skill `code-review`): Spec then Standards — honeypot invisibility to assistive tech, PII care (author_phone never rendered), no N+1 in list.

## Acceptance criteria
1. `bun run test:unit -- src/lib/server/comments` green: list matrix, both rate windows, honeypot, reply uniqueness/ownership.
2. Stories U6/U11 verified at S2 (suites above) and S3 (`e2e/comments.spec.ts`).
3. `grep -rn "verified" src/lib/db/schema.ts` prints nothing (verified stays computed, never stored).
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- IP source resolution identical to T06's (x-forwarded-for first entry → x-real-ip → 'local').
- Rate-limit denial copy includes retry-after in minutes (computed from `retryAfterSec`, rounded up).
- Comments on paused/deleted listings: section renders read-only (form hidden) — the detail page's visibility rules already gate access.

## Fallbacks
- If the unique partial index cannot be expressed in the pinned drizzle-kit version, enforce single-reply in `reply.ts` with an existence check inside a transaction AND file a request to add the index in a schema amendment; note the weakened guarantee in the report.

## Hand-off
Report at `.jules/reports/T15.md`. For T17: seed comments incl. one verified match and one farmer reply. For T18: rate-limit windows and badge computation are the audit hot spots.
