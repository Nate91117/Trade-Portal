import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS trades (
  id          SERIAL PRIMARY KEY,
  trade_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  entity      TEXT NOT NULL,
  account     TEXT NOT NULL,
  strategy    TEXT NOT NULL,
  trader      TEXT NOT NULL,
  direction   TEXT NOT NULL CHECK (direction IN ('Buy', 'Sell')),
  month       TEXT NOT NULL,
  product     TEXT NOT NULL,
  qty         NUMERIC NOT NULL,
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Synced')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function runMigration() {
  try {
    await sql(SCHEMA);
    return NextResponse.json({ ok: true, message: 'Migration complete — trades table is ready.' });
  } catch (err) {
    console.error('[migrate]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export const GET = runMigration;
export const POST = runMigration;
