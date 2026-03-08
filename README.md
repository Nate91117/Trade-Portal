# Intercompany Futures Portal

Internal trade entry and management UI for intercompany futures trades.

**Stack:** Next.js 14 · Tailwind CSS · Neon PostgreSQL · Vercel

---

## Project Structure

```
trade-portal/
├── app/
│   ├── api/
│   │   ├── migrate/route.ts       # Run DB migration on demand
│   │   └── trades/
│   │       ├── route.ts           # GET (list) · POST (create)
│   │       └── [id]/route.ts      # PUT (update) · DELETE
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # App shell with tab routing
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── TradeEntry.tsx             # Form + live net summary
│   ├── TodaysTrades.tsx           # Inline edit / delete
│   └── HistoricalArchive.tsx      # Date range · search · CSV export
├── db/
│   └── schema.sql
├── lib/
│   ├── constants.ts               # Dropdown values
│   ├── db.ts                      # Neon client singleton
│   └── types.ts
├── .env.local.example
├── vercel.json                    # Deploys to iad1 (co-located w/ Neon US East)
└── README.md
```

---

## 1 · Neon Setup

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Create a new project (choose **US East (Ohio)** region for lowest latency with Vercel `iad1`).
3. In the project dashboard → **Connection Details** → copy the **Connection string** (starts with `postgresql://`).

---

## 2 · Local Development

```bash
# Install dependencies
npm install

# Create your local env file
cp .env.local.example .env.local
# Paste your Neon connection string as DATABASE_URL in .env.local

# Run the migration (creates the trades table)
curl http://localhost:3000/api/migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 3 · Vercel Deployment

### Option A — One-click via Vercel CLI

```bash
npm i -g vercel
vercel
# Follow the prompts, then add the env var when asked
```

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**.
3. Select your repo → click **Deploy**.
4. After the initial deploy finishes, go to **Settings → Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` |

5. Re-deploy (Vercel → **Deployments → Redeploy**).

### Run the Migration on Vercel

After your first deploy, visit:

```
https://your-app.vercel.app/api/migrate
```

This creates the `trades` table in Neon. You only need to do this once.

---

## 4 · Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string with `?sslmode=require` |

---

## 5 · API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/trades` | All trades |
| `GET` | `/api/trades?date=today` | Today's trades only |
| `GET` | `/api/trades?from=YYYY-MM-DD&to=YYYY-MM-DD` | Date range |
| `POST` | `/api/trades` | Create a trade |
| `PUT` | `/api/trades/:id` | Update a trade |
| `DELETE` | `/api/trades/:id` | Delete a trade |
| `GET` | `/api/migrate` | Create / update DB schema |

---

## 6 · Customizing Dropdown Values

Edit [`lib/constants.ts`](lib/constants.ts) to update traders, products, strategies, and the default entity/account.
