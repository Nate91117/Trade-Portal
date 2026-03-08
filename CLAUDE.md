# Trade Portal — Project Context

Intercompany futures trade entry and management UI for Pilot Flying J.

## Stack
- **Framework**: Next.js 14 App Router
- **Styling**: Tailwind CSS — primary red `#E11932`
- **Icons**: lucide-react
- **DB**: Neon serverless PostgreSQL via `@neondatabase/serverless` (provisioned via Vercel Storage integration)
- **Deploy**: Vercel — live at https://github.com/Nate91117/Trade-Portal

## Status
- **Live and DB-connected**
- `DATABASE_URL` is set automatically via Vercel + Neon integration (no manual env var needed)
- Migration has been run — `trades` table exists

## Local Dev Setup (optional)
1. `npm install`
2. In Vercel → Storage → Neon DB → copy the `.env.local` snippet into a new `.env.local` file
3. `npm run dev`
4. Visit `http://localhost:3000/api/migrate` if running against a fresh DB

## Key Files
- `lib/constants.ts` — strategies, traders, products, contract months, and STRATEGY_CONFIG (entity/account mapping)
- `db/schema.sql` — source of truth for schema; `app/api/migrate/route.ts` runs it
- `app/api/trades/route.ts` — GET (list/filter) + POST
- `app/api/trades/[id]/route.ts` — PUT + DELETE
- `components/TradeEntry.tsx` — entry form; strategy drives entity/account auto-fill; QTY always positive, sign applied from Buy/Sell on submit
- `components/TodaysTrades.tsx` — inline edit (strategy cascades to entity/account), optimistic delete
- `components/HistoricalArchive.tsx` — date range, search, CSV export

## Business Logic
- **Strategy → Entity/Account**: Strategies 1–3 map to Entity `Tartan` (PFJ-001–003); Strategies 4–10 map to Entity `PTC` (PFJ-004–010). Defined in `STRATEGY_CONFIG` in `lib/constants.ts`.
- **QTY sign**: Users always enter positive quantities. Buy trades store positive qty; Sell trades store negative qty. Net position summary and trade displays are sign-aware.
- **Contract months**: 12 months rolling from current month, formatted with CME codes (e.g. `H - March 2026`)
- **Products**: HO - Diesel, RB - Gasoline, C - Corn

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
- Status toggle button (mark Pending → Synced from Today's Trades view)
- Trade blotter PDF export
- Admin page to manage dropdown values from the UI
- Authentication (currently open — anyone with the URL can access)
