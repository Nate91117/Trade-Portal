# Trade Portal — Project Context

Intercompany futures trade entry and management UI for Pilot Flying J.

## Stack
- **Framework**: Next.js 14 App Router
- **Styling**: Tailwind CSS — primary red `#E11932`
- **Icons**: lucide-react
- **DB**: Neon serverless PostgreSQL via `@neondatabase/serverless`
- **Deploy**: Vercel (region: `iad1` to co-locate with Neon US East)

## Status
- Code complete — not yet deployed or DB-connected
- No `.env.local` created yet (copy from `.env.local.example`)
- `DATABASE_URL` not set

## Setup Steps (do once)
1. `npm install`
2. Copy `.env.local.example` → `.env.local`, fill in Neon `DATABASE_URL`
3. `npm run dev`
4. Visit `http://localhost:3000/api/migrate` to create the `trades` table

## Deploy Steps
1. Push to GitHub
2. Import repo at vercel.com/new
3. Add `DATABASE_URL` env var in Vercel project settings
4. Redeploy, then visit `/api/migrate` once on the live URL

## Key Files
- `lib/constants.ts` — edit dropdown options (strategies, traders, products, entity/account defaults)
- `db/schema.sql` — source of truth for schema; `app/api/migrate/route.ts` runs it
- `app/api/trades/route.ts` — GET (list/filter) + POST
- `app/api/trades/[id]/route.ts` — PUT + DELETE
- `components/TradeEntry.tsx` — form, QTY validation, live net summary
- `components/TodaysTrades.tsx` — inline edit, optimistic delete
- `components/HistoricalArchive.tsx` — date range, search, CSV export

## Schema
```sql
trades (
  id, trade_date, entity, account, strategy, trader,
  direction CHECK ('Buy'|'Sell'),
  month, product, qty, note,
  status CHECK ('Pending'|'Synced') DEFAULT 'Pending',
  created_at, updated_at
)
```

## Potential Phase 2 Tasks
- Authentication (currently no login — header shows static "Trader")
- Status toggle button (mark Pending → Synced from Today's Trades view)
- Multi-entity support (per-user entity/account auto-fill)
- Trade blotter PDF export
- Admin page to manage dropdown values from the UI
