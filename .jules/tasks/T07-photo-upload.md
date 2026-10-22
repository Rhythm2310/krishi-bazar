# T07: Photo upload pipeline — WebP, direct-to-storage

Wave: 6 | Model: default | Size: M | Mode: feature
Branch: `jules/T07-photo-upload` | PR title: `[T07] Photo upload pipeline WebP direct-to-storage`
Skills: domain-language, tdd, code-review, pr
Serves: U8 | Seams under test: S1, S2

Read `/AGENTS.md` first. It overrides anything below that conflicts with sections 5, 6, 8, 11.

## Objective
Farmers attach 1–3 photos to a Listing. Every stored image is WebP ≤2MB, downscaled to ≤1600px in the browser before upload, uploaded **direct to Vercel Blob** (never through a function body — 4.5MB limit) via the handleUpload token flow, with a **local-disk storage adapter** used automatically when `BLOB_READ_WRITE_TOKEN` is unset (dev, tests, CI). The token endpoint is farmer-gated and IP-rate-limited.

## Context pointers
- Always: `GLOSSARY.md` (Listing); `.jules/spec.md` story U8 + Photos decisions.
- `.jules/reports/T06.md`: session gate + rate-limit patterns you reuse (kind `upload`, 20/hr from rates.ts).
- Pinned APIs: `@vercel/blob` 2.8.1 — use its documented client direct-upload (`@vercel/blob/client` `upload` with `clientToken`) and `handleUpload` callback shape from the 2.8.x docs, not memory.

## Owned paths (write)
src/routes/api/upload/**, src/lib/server/upload/**, src/lib/photos/**, src/lib/components/photos/**, src/lib/i18n/bn/photos.ts, src/lib/i18n/en/photos.ts
Also yours: `.jules/reports/T07.md`

## Read-only inputs
src/lib/server/auth/**, src/lib/domain/rate-limit.ts, src/lib/data/rates.ts (photo limits), src/lib/components/ui/**

## Forbidden
- Any path not listed above. Routing image bytes through a serverless function body in blob mode. New dependencies (no image libraries — canvas + Blob APIs only).

## Steps
1. `src/lib/photos/convert.ts` — pure helpers (Slice, U8, S1, red first): `planResize(width, height, maxEdge=1600)` → target dims (aspect kept, no upscaling); `isSupportedSource(type, sizeBytes)` against rates.ts photo limits; `webpEncodeSupported()` feature-detect wrapper around a probe (canvas `toBlob('image/webp')` result type check) designed for injection in tests; `conversionErrorCode` union for localized failures (`unsupported`, `too_large`, `decode_failed`, `encode_failed`). Tests: resize math (portrait/landscape/small-no-op), source acceptance matrix, every error code reachable.
2. `src/lib/photos/convert.browser.ts`: the DOM side — file → `createImageBitmap` → OffscreenCanvas/canvas → `toBlob('image/webp', 0.82)` with one quality-retry at 0.7 if the result exceeds 2MB, mapping failures to the error codes. No Svelte imports (usable from the component and testable in e2e only — keep logic in step 1's pure core).
3. `src/lib/server/upload/storage.ts` — the storage seam: `storageMode()` = `'blob'` when `BLOB_READ_WRITE_TOKEN` set else `'local'`; `issueToken(filename, contentType, sizeBytes)` → blob mode: `handleUpload`-style client token via `@vercel/blob/client` `generateClientTokenFromReadWriteToken`-equivalent from the 2.8.x API (follow pinned docs); local mode: signed-ish random id + record in `.data/uploads/index.json`; `localUploadPath(id)`; `publicUrlFor(id|blobUrl)`. Local files live under `.data/uploads/` (gitignored since T01) and are served by a route below. Done when: both modes round-trip a byte string in an S2 test (inject env per test).
4. `POST /api/upload/token` (Slice, U8, S2, red first): requires `locals.farmer` (401 JSON `{error,code}` otherwise — API routes use JSON per AGENTS conventions); rate-limit kind `upload` (20/hr/IP) → 429 JSON; body `{ filename, contentType, sizeBytes }` validated (contentType must be an accepted source type; sizeBytes ≤ 8MB pre-conversion, ≤ 2MB when contentType is already webp); returns `{ mode, clientToken?, uploadUrl? }` per storage mode. Tests: 401, 429 on 21st, bad type 400, oversize 400, blob-mode token shape (mock env), local-mode payload.
5. Local-mode file routes: `POST /api/upload/local` (multipart via `request.formData()`, farmer-gated, writes `.data/uploads/<id>.webp` after re-checking magic bytes `RIFF....WEBP` and size ≤2MB) and `GET /uploads-local/[name]` streaming the file with `Content-Type: image/webp` + immutable cache header (name validated against the index — no path traversal; traversal test required). Blob mode: `POST /api/upload/complete` implementing the `handleUpload` callback contract from the pinned `@vercel/blob` docs (validates token, returns `{ url }` JSON). Tests: magic-byte rejection (PNG bytes renamed .webp → 400), traversal `..%2f` → 404, happy round-trip.
6. `src/lib/components/photos/PhotoPicker.svelte` (client): props `max=3`, `name='photos'`; on file select runs convert.browser → immediate upload (blob or local mode from the token response) → shows thumbnail preview, progress state, per-file error with localized retry; hidden inputs carry the final public URLs in order; remove button drops a selection (orphaned blobs are acceptable — noted in spec Further Notes). Keyboard accessible, works at 360px. Done when: manual dev flow uploads 3 photos and the form serializes their URLs (proven in T09's e2e — here, a dev-mode harness page is NOT allowed; verify via component render in the T09 e2e and keep this task's proof at S1/S2).
7. Dictionaries `bn/en/photos.ts` (errors, button labels, limits copy). Parity test enforces both.
8. Self-review pass (skill `code-review`): Spec then Standards — magic-byte check server-side in BOTH modes, no secret leakage in tokens/logs.

## Acceptance criteria
1. `bun run test:unit -- src/lib/photos src/lib/server/upload` green; `bun run test:unit -- src/routes/api/upload` green.
2. Story U8 (photo pipeline portion) verified at S2 by `src/routes/api/upload/token.test.ts` and `local.test.ts` (auth, rate, validation, magic bytes, traversal, round-trip).
3. With `BLOB_READ_WRITE_TOKEN` unset, the full local flow works end-to-end in dev (demonstrated by the S2 round-trip test, not a manual claim).
4. `bun run verify` passes and `python .jules/tools/slop_guard.py` reports no ERROR.

## Decision defaults
- Accepted source types (pre-conversion): jpeg, png, webp. Output is always webp.
- Filenames in storage are random ids (`crypto.randomUUID()`); original names are never stored or logged.
- JSON error shape on all `/api/**`: `{ error: '<key>', code: <http status> }`.
- Pre-conversion size cap 8MB (phones rarely exceed); post-conversion hard cap 2MB.

## Fallbacks
- If the pinned `@vercel/blob` client-token API differs from the shape above, follow the installed package's docs exactly and record the call signatures in the report — the seam (`storage.ts`) keeps the rest untouched.
- If `createImageBitmap` is unavailable in a target browser, fall back to `HTMLImageElement` decoding inside convert.browser (same error codes).

## Hand-off
Report at `.jules/reports/T07.md`. For T09: drop `<PhotoPicker name="photos" max={3}/>` into the listing form; the action receives `photos: string[]` of public URLs (≤3, may be empty). For T11/T12: render `photo ?? '/placeholder.webp'` (T01's asset) with width/height attrs.
