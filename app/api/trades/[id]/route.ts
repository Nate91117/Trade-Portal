import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getDb();
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await request.json();
    const {
      trade_date, trade_type, entity, account, strategy, trader,
      direction, month, product, qty, note,
      strategy_2, account_2, gives_takes, price_type, price, status,
      pfj_associated_id,
    } = body;

    const result = await sql`
      UPDATE trades
      SET
        trade_date  = ${trade_date},
        trade_type  = ${trade_type},
        entity      = ${entity ?? null},
        account     = ${account},
        strategy    = ${strategy},
        trader      = ${trader ?? null},
        direction   = ${direction ?? null},
        month       = ${month},
        product     = ${product},
        qty         = ${qty},
        note        = ${note || null},
        strategy_2  = ${strategy_2 ?? null},
        account_2   = ${account_2 ?? null},
        gives_takes = ${gives_takes ?? null},
        price_type  = ${price_type ?? null},
        price       = ${price ?? null},
        status      = ${status ?? 'Pending'},
        pfj_associated_id = ${pfj_associated_id ?? null},
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (err) {
    console.error('[PUT /api/trades/:id]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getDb();
    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const result = await sql`DELETE FROM trades WHERE id = ${id} RETURNING id`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[DELETE /api/trades/:id]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
