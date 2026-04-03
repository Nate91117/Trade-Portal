import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type'); // 'TAS' | 'Internal' | null (all)

    let trades;

    if (date === 'today') {
      if (type) {
        trades = await sql`
          SELECT * FROM trades
          WHERE trade_date = CURRENT_DATE AND trade_type = ${type}
          ORDER BY created_at DESC
        `;
      } else {
        trades = await sql`
          SELECT * FROM trades
          WHERE trade_date = CURRENT_DATE
          ORDER BY created_at DESC
        `;
      }
    } else if (date) {
      if (type) {
        trades = await sql`
          SELECT * FROM trades
          WHERE trade_date = ${date} AND trade_type = ${type}
          ORDER BY created_at DESC
        `;
      } else {
        trades = await sql`
          SELECT * FROM trades
          WHERE trade_date = ${date}
          ORDER BY created_at DESC
        `;
      }
    } else if (from && to) {
      if (type) {
        trades = await sql`
          SELECT * FROM trades
          WHERE trade_date BETWEEN ${from} AND ${to} AND trade_type = ${type}
          ORDER BY trade_date DESC, created_at DESC
        `;
      } else {
        trades = await sql`
          SELECT * FROM trades
          WHERE trade_date BETWEEN ${from} AND ${to}
          ORDER BY trade_date DESC, created_at DESC
        `;
      }
    } else {
      if (type) {
        trades = await sql`
          SELECT * FROM trades
          WHERE trade_type = ${type}
          ORDER BY trade_date DESC, created_at DESC
        `;
      } else {
        trades = await sql`
          SELECT * FROM trades
          ORDER BY trade_date DESC, created_at DESC
        `;
      }
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
    const {
      trade_date, trade_type, entity, account, strategy, trader,
      direction, month, product, qty, note,
      strategy_2, account_2, gives_takes, price_type, price,
      pfj_associated_id,
    } = body;

    if (!trade_date || !trade_type || !account || !strategy || !month || !product || qty == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const absQty = Math.abs(Number(qty));
    if (absQty <= 0 || isNaN(absQty)) {
      return NextResponse.json({ error: 'Quantity must be greater than zero' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO trades (
        trade_date, trade_type, entity, account, strategy, trader,
        direction, month, product, qty, note,
        strategy_2, account_2, gives_takes, price_type, price,
        pfj_associated_id
      )
      VALUES (
        ${trade_date}, ${trade_type}, ${entity ?? null}, ${account}, ${strategy},
        ${trader ?? null}, ${direction ?? null}, ${month}, ${product}, ${qty},
        ${note || null}, ${strategy_2 ?? null}, ${account_2 ?? null}, ${gives_takes ?? null},
        ${price_type ?? null}, ${price ?? null},
        ${pfj_associated_id ?? null}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (err) {
    console.error('[POST /api/trades]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
