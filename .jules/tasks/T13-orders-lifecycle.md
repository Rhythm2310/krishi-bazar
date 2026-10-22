# T13: Orders, lifecycle, stock and farmer dashboard

Wave: 12 | Model: default | Size: L | Mode: feature (design-heavy)
Branch: `jules/T13-orders-lifecycle` | PR title: `[T13] Orders lifecycle stock and farmer dashboard`
Skills: domain-language, tdd, codebase-design, code-review, pr
Serves: U4, U5, U10 | Seams under test: S1, S2, S3

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
The money-and-stock core: a Buyer orders any allowed quantity with a Delivery speed and sees a live estimate that matches the server total exactly; stock is reserved by one atomic conditional UPDATE so overselling is impossible; the order confirmation page (token-gated) shows the breakdown and the Farmer's phone and allows cancellation while নতুন; Farmers see only their own orders with buyer contact and drive the state machine (accept, reject-with-reason, পথে, সম্পন্ন); unaccepted orders expire after 24h — evaluated lazily on every read — and every terminal transition releases reserved Stock.

## Context pointers
- Always: `GLOSSARY.md` (Order, Stock, Expired order, Delivery speed); `.jules/spec.md` U4/U5/U10 + Orders-lifecycle decisions; `docs/adr/0002-money-integer-paisa.md`.
- Contracts: `src/lib/domain/order-machine.ts` (ALL transitions), `src/lib/domain/{money,units,clock}.ts` (totals, surcharges, expiry math), `src/lib/data/rates.ts` (surcharge per kg, 24h expiry), `src/lib/db/schema.ts` (orders columns).
- `.jules/reports/T12.md`: OrderBox mount point in `/p/[id]`.

## Owned paths (write)
src/routes/p/[id]/**, src/routes/order/**, src/routes/farmer/orders/**, src/lib/server/orders/**, src/lib/components/orders/**, src/lib/i18n/bn/orders.ts, src/lib/i18n/en/orders.ts, e2e/orders.spec.ts
Also yours: `.jules/reports/T13.md`

## Read-only inputs
src/lib/domain/**, src/lib/db/**, src/lib/server/listings/**, src/lib/components/{ui,listings,detail? (T12's detail components),market}/**, src/lib/i18n/{index,format}.ts

## Forbidden
- Any path not listed above. Any stock mutation outside `src/lib/server/orders/stock.ts`; any transition not in `order-machine.ts`; any total computed outside the pricing helpers.

## Steps
1. `src/lib/server/orders/stock.ts` (Slice, U4, S2, red first): `reserveStock(tx, listingId, qtyH)` → single statement `UPDATE listings SET qty = qty - <qty> WHERE id = <id> AND status='active' AND qty >= <qty> RETURNING qty` — returns new qty or null (failed); `releaseStock(tx, listingId, qtyH)` → guarded increment. Numeric hundredths map to numeric(12,2) via string. Tests via `withTestDb`: reserve success decrements exactly; reserve of qty == stock succeeds to 0; reserve over stock returns null and leaves qty untouched; reserve on paused listing fails; release restores; **sequential double-reserve of the last unit: first wins, second null, qty never negative** (the deterministic oversell invariant — PGlite serializes, the conditional UPDATE is the guard; state this in a test comment).
2. `src/lib/server/orders/pricing.ts`: `computeOrderTotals({ pricePaisa, qtyH, categoryId, unitId, speed })` → `{ goodsPaisa, deliveryPaisa, totalPaisa }` = `money.mulQty(price, qtyH)` + `units.deliverySurchargePaisa(...)`; one function used by BOTH the server action and the client estimate (isomorphic, pure). Tests: hand-computed golden cases per unit kind (kg, মণ, pc, litre) and both speeds; property (fast-check): total = goods + delivery exactly, drift 0.
3. `src/lib/server/orders/create.ts` (Slice, U4, S2, red first): `placeOrder(db, { listingId, form, ip }, { now })` → validate with orderSchema (qty > 0 and ≤ current stock, speed enum, buyer fields), reject `buyer_phone === farmer.phone` (normalized — keyed error), rate-limit kind `order` (10/hr/IP), then in ONE transaction: reserveStock → on null return keyed `stock` error → insert order (id uuid, totals from computeOrderTotals, cancel_token 16-byte base64url, expires_at = now+24h, status 'new') → return `{ orderId, cancelToken }`. Tests: happy path row exactness (paisa columns, expires_at ≈ now+24h); over-stock rejection leaves no order row; self-purchase blocked; 11th order in an hour blocked; concurrent last-unit race (step 1's invariant through `placeOrder`).
4. `src/lib/server/orders/expiry.ts` (Slice, U10, S2): `expireStaleOrders(db, { now })` → selects `status='new' AND expires_at < now`, and per order in a transaction applies the machine's `expire` event: status='cancelled', reject_reason='expired', releaseStock. Idempotent (second run finds nothing). Called from EVERY read path in this task: farmer dashboard load, order confirmation load, detail page availability (T12's load — you own `p/[id]/**` now, add the call). Tests: seeded order 25h old → after sweep cancelled + stock restored; order 23h old untouched; double sweep safe.
5. `src/lib/server/orders/transition.ts` (Slice, U10, S2): `applyFarmerEvent(db, { orderId, farmerId, event, reason? }, { now })` → loads order + listing (404 unless listing.farmer_id === farmerId), `order-machine.transition` — invalid → typed error mapped to a keyed flash; valid → UPDATE status/reason/updated_at in a transaction, with releaseStock for reject. Buyer side: `cancelByToken(db, { orderId, token }, { now })` → machine's buyer_cancel only from 'new', token match required, releaseStock. Tests: full legal path new→accepted→in_transit→delivered; every illegal jump rejected (table-driven from the machine); reject restocks; buyer cancel while new restocks; cancel after accept → keyed error; wrong token → 404-class error.
6. Buyer UI (Slice, U4, S3): OrderBox mounted at T12's marker in `/p/[id]` — qty stepper (per-unit step/min/max from `units.UNITS`, capped at stock), SpeedPicker (two radio cards: localized label, promised days, computed surcharge display for the CURRENT qty via computeOrderTotals — live estimate updates on input/change via the pure function, no server round-trip), buyer name/phone/address Fields, total panel (goods + delivery = total, all `formatTaka`), submit → `?/order` action (`use:enhance`). Disabled out-of-stock state with localized copy. Confirmation route `/order/[id]/+page.server.ts`: token from `?t=` must match `cancel_token` (else 404); load runs `expireStaleOrders` first; page shows breakdown, speed label, farmer phone (tel: link), deadline line ("কৃষক ২৪ ঘণ্টার মধ্যে গ্রহণ না করলে অর্ডার বাতিল হবে"), cancel button while status='new' (POST `?/cancel` with token), status line otherwise; "কৃষক শীঘ্রই যোগাযোগ করবেন" reassurance.
7. Farmer dashboard (Slice, U10, S3): `/farmer/orders/+page.server.ts` — runs `expireStaleOrders`, loads own orders (join listings where farmer_id = session) newest first with product name/unit/photo, qty, total breakdown, speed, buyer name/phone/address (ONLY surface with buyer PII), status badge, created/deadline; status tab filter via `?status=`; per-state action buttons from the machine (accept | reject+reason select | mark পথে | mark সম্পন্ন) posting to `?/transition` actions calling `applyFarmerEvent`; empty state per tab. `/farmer/+page.svelte` is NOT yours — link requests via 5.7 if the dashboard needs an entry link (header nav from T02 already reaches /farmer; acceptable).
8. `e2e/orders.spec.ts` (Slice, U4+U5+U10, S3, red first): seed farmer+listing via globalSetup helper (reuse T11 mechanism; qty 2.5 kg, price 4550 paisa); buyer journey: open detail → estimate shows goods ৳113.75→Bengali numerals + express surcharge (kg-equivalent math) → order 1.5 kg express → confirmation shows total = goods+delivery exactly as estimated, farmer phone visible, cancel button visible; farmer login → dashboard shows the order with buyer phone/address → accept → badge গৃহীত → পথে → সম্পন্ন; second order then farmer reject with reason → listing stock visibly restored on detail; buyer-cancel flow on a fresh order. Axe on confirmation + dashboard.
9. Dictionaries `bn/en/orders.ts`: status labels (নতুন/গৃহীত/পথে/সম্পন্ন/বাতিল), reasons (স্টক নেই/দাম ভুল/অন্য কারণ/মেয়াদোত্তীর্ণ), speed labels, all buttons/errors/confirmation copy. Parity enforced.
10. Self-review pass (skill `code-review`): Spec then Standards — every stock mutation goes through stock.ts (grep proof in report); every transition through the machine; totals only via pricing.ts; PII only on dashboard+confirmation.

## Acceptance criteria
1. `bun run test:unit -- src/lib/server/orders` green: stock invariants, golden totals per unit kind, create rejections, expiry idempotence, full transition table, token cancel.
2. Stories U4/U5/U10 verified at S2 (suites above) and S3 (`e2e/orders.spec.ts` full journey + reject-restock + cancel).
3. Oversell invariant proven: the double-reserve test asserts qty never negative and exactly one order row exists.
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Statuses stored in English enum ids; Bangla labels only via dictionaries.
- `updated_at` set by every transition (explicit in the UPDATE — no DB triggers).
- Flash messages: single-use cookie or URL param `?ok=<key>` on redirect — choose URL param (stateless); confirmation page is the redirect target for create.
- Deadline display: computed from `expires_at` via `formatDate` + a localized "within 24 hours" line; no live countdown timer (bloat).

## Fallbacks
- If a single PGlite transaction across reserve+insert proves unsupported in the pinned drizzle/pglite combo, use the sequential-statement form inside `db.batch`/interactive transaction per the pinned docs — the conditional UPDATE guard remains the invariant; document the exact call in the report.
- If the e2e estimate assertion fights Bengali numeral rendering, assert on the `data-paisa` attributes the total panel carries (add them — they are test seams, not UI).

## Hand-off
Report at `.jules/reports/T13.md`. For T15: verified-buyer matching reads `orders.buyer_phone` + status ≠ cancelled for the listing. For T16: order counts per listing = `count(orders where listing_id and status != 'cancelled')`. For T17: seed expired orders by backdating `created_at`/`expires_at`.
