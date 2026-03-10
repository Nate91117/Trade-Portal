import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS trades (
  id          SERIAL PRIMARY KEY,
  trade_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  trade_type  TEXT NOT NULL DEFAULT 'TAS' CHECK (trade_type IN ('TAS', 'Internal')),
  entity      TEXT,
  account     TEXT NOT NULL,
  strategy    TEXT NOT NULL,
  trader      TEXT,
  direction   TEXT CHECK (direction IN ('Buy', 'Sell')),
  month       TEXT NOT NULL,
  product     TEXT NOT NULL,
  qty         NUMERIC NOT NULL,
  note        TEXT,
  strategy_2  TEXT,
  account_2   TEXT,
  gives_takes TEXT CHECK (gives_takes IN ('Gives', 'Takes')),
  status      TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Synced')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const MIGRATIONS = `
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_type TEXT NOT NULL DEFAULT 'TAS';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS strategy_2  TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_2   TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS gives_takes TEXT;
ALTER TABLE trades ALTER COLUMN entity    DROP NOT NULL;
ALTER TABLE trades ALTER COLUMN trader    DROP NOT NULL;
ALTER TABLE trades ALTER COLUMN direction DROP NOT NULL;
`;

async function runMigration() {
  try {
    const sql = getDb();
    await sql(SCHEMA);
    await sql(MIGRATIONS);
    return NextResponse.json({ ok: true, message: 'Migration complete — trades table is ready.' });
  } catch (err) {
    console.error('[migrate]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export const GET = runMigration;
export const POST = runMigration;
