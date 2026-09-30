# SMS ↔ Website — Shared Google Sheet Protocol
**Sheet ID:** `13dbk2BahMTNl7fZgrjpwKMru8XvPnhpSX-AqTsysYkk`
**Last organized:** 2026-09-30 (82 junk/duplicate rows removed, 2 real orders rescued)

## Tabs (do NOT rename)
| Tab | Purpose | Writer |
|---|---|---|
| `الطلبات المؤكدة` | Confirmed orders | Website (appends), SMS sender (status) |
| `السلات المتروكة` | Abandoned carts | Website only |

## Column ownership — `الطلبات المؤكدة`
| Cols | Owner | Rule |
|---|---|---|
| A:P (orderId → email status) | **Website** | Appends new rows, updates col P only |
| Q:R (SMS status, SMS date) | **SMS sender** | Website NEVER writes here |
| Row 1 (headers) | — | NEVER edit, move, or delete |

Key columns:
- **A = orderId** — unique per order. Website searches it to update email status. Never duplicate it, never clear it.
- **D = phone** — leading zero as text (`'0667...`). This is how SMS matches customers. Never reformat.
- **P = email status** (`⏳ قيد الإرسال` / `✅ تم الإرسال` / `❌ فشل الإرسال`) — website-owned.
- **N = order status** (`⏳ قيد التأكيد`) — fulfillment workflow, coordinate before changing values.

## Rules for both sides
1. **NEVER delete, reorder, or insert columns.** Delete whole ROWS only.
2. **Delete rows bottom-up** (highest row number first) so row numbers stay valid.
3. **Same phone twice ≠ duplicate.** Different orderIds = real reorders — keep both, send one SMS per order unless flagged `↪ مكرر`.
4. **Duplicates** = same orderId twice → keep earliest row, delete later copies.
5. **Empty rows**: safe to delete (bottom-up). Gaps break nothing but keep the sheet clean.
6. **Backup before any bulk delete** (copy tab → `باك اب YYYY-MM-DD`).
7. **Low-traffic window** for bulk ops — the website caches row numbers briefly when marking email status.
8. New orders arrive with `⏳ قيد التأكيد` + `⏳ قيد الإرسال` and empty Q:R = ready for SMS.

## Current state (2026-09-30)
- Orders: 16 clean rows, 0 duplicates, 0 gaps. Leads: 15 rows, untouched.
- Rescued: ORD-901555 (مراد, Chlef) + ORD-280323 (فادي بوشارب, Taoura) — were shifted into cols P:AE, now realigned to A:P with `⏳ قيد الإرسال`. They never got email or SMS — **call them first**.
- Website no longer writes images into col Q (was clobbering SMS state) — fixed in code `d31dabb`.

## Contacts
- Website/sheet owner: repo `oguenfoude/afairdz` (`src/lib/googleSheet.ts`)
- Order notification emails: shaimadjiab1997@gmail.com, have07102@gmail.com
