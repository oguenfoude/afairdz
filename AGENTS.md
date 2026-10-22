<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# afairdz — Algerian COD landing page (Next.js 16, App Router, Vercel)

Arabic-first RTL store (`<html lang="ar" dir="rtl">`). Nearly all UI is the single client component `src/app/page.tsx`. No database — data is JSON files, hardcoded constants, and a shared Google Sheet.

## Commands

- `npm run dev` — dev server (re-generates the block above; commit it)
- `npm run lint` — eslint flat config (eslint-config-next); no prettier
- `npx tsc --noEmit` — typecheck (no npm script exists)
- `npm run build` — verify before shipping
- **No test framework.** Ad-hoc E2E scripts live in gitignored `scratch/`: `node scratch/e2e-order.js http://127.0.0.1:3100` (API flow), `node scratch/e2e-ui.js <url>` (Playwright browser flow), plus sheet-probe scripts.

## Architecture

- Product config (models, packages, delivery-fee overrides, notices) is hardcoded in `src/lib/fallback.ts`; `src/lib/data.ts` just returns it.
- Wilayas/communes/per-commune fees: `src/data/wilayasData.json` (58 wilayas) exposed through `src/data/wilayas.ts`. `update_fees.js` at repo root is a one-off migration that rewrites that JSON — don't run it blindly.
- `src/lib/phoneGuard.ts` is **in-memory only** — phone history/blocks reset per serverless invocation. Don't assume persistence.
- All API routes export `const dynamic = 'force-dynamic'` and set CDN `s-maxage` headers themselves:
  - `POST /api/order` — validate → append `data/orders.csv` backup → append row to Google Sheet → send email → update email-status cell. `maxDuration = 30`.
  - `POST /api/abandoned-lead` — same pattern, sheet tab `السلات المتروكة`, with strict "all fields filled" validation.
  - `GET /api/models`, `/api/fees`, `/api/settings` — serve the fallback data.

## Google Sheet contract (full protocol: `SMS_SHEET_PROTOCOL.md`)

- Website owns columns **A:P only** on tab `الطلبات المؤكدة`. **Columns Q:R belong to an external SMS sender — never write there** (a past bug clobbered SMS state).
- Never delete/reorder/insert columns; delete whole rows bottom-up only; never touch row 1 headers.
- Phone is written with a leading `'` so the leading zero survives as text.
- Google service-account credentials are **hardcoded in `src/lib/googleSheet.ts`** (not env-driven).
- Status values like `⏳ قيد الإرسال` / `⏳ قيد التأكيد` are matched exactly by the SMS side — keep emoji + Arabic text verbatim.

## Email (`src/lib/mailer.ts`)

- SMTP via nodemailer: `SMTP_USER`/`SMTP_PASS` (or legacy `GOOGLE_EMAIL`/`GOOGLE_APP_PASSWORD`) — see `.env.example`. Uses Gmail transport when `SMTP_HOST` is unset.
- Recipients: `ADMIN_EMAIL` (comma list) **plus two hardcoded mandatory addresses** (`getAdminRecipients`).

## Gotchas

- Tailwind **v4** — no `tailwind.config.js`; config and custom animations live in `src/app/globals.css` via `@import "tailwindcss"`.
- `next/image` external hosts are whitelisted in `next.config.ts` (imgur, `*.public.blob.vercel-storage.com`) — new hosts must be added there.
- Watch-model ids are **strings** (`'m1'`…); a past `Number()` conversion caused `NaN` and broken selection. Compare as strings.
- `.env*` is gitignored (only `.env.example` is committed). `data/*.csv` runtime backups ARE tracked in git.
- `@vercel/blob` is still in `package.json` but currently unused — persistence was stripped to fallback/in-memory.
- UI copy is Arabic; keep it RTL-aware and in the same tone when editing.
