import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let trades;

    if (date === 'today') {
      trades = await sql`
        SELECT * FROM trades
        WHERE trade_date = CURRENT_DATE
        ORDER BY created_at DESC
      `;
    } else if (date) {
      trades = await sql`
        SELECT * FROM trades
        WHERE trade_date = ${date}
        ORDER BY created_at DESC
      `;
    } else if (from && to) {
      trades = await sql`
        SELECT * FROM trades
        WHERE trade_date BETWEEN ${from} AND ${to}
        ORDER BY trade_date DESC, created_at DESC
      `;
    } else {
      trades = await sql`
        SELECT * FROM trades
        ORDER BY trade_date DESC, created_at DESC
      `;
    }

    return NextResponse.json(trades);
  } catch (err) {
    console.error('[GET /api/trades]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getDb();
    const body = await request.json();
    const { trade_date, entity, account, strategy, trader, direction, month, product, qty, note } = body;

    if (!trade_date || !entity || !account || !strategy || !trader || !direction || !month || !product || qty == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO trades (trade_date, entity, account, strategy, trader, direction, month, product, qty, note)
      VALUES (
        ${trade_date},
        ${entity},
        ${account},
        ${strategy},
        ${trader},
        ${direction},
        ${month},
        ${product},
        ${qty},
        ${note || null}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (err) {
    console.error('[POST /api/trades]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
