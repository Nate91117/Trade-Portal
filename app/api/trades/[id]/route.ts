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
    const { trade_date, entity, account, strategy, trader, direction, month, product, qty, note, status } = body;

    const result = await sql`
      UPDATE trades
      SET
        trade_date = ${trade_date},
        entity     = ${entity},
        account    = ${account},
        strategy   = ${strategy},
        trader     = ${trader},
        direction  = ${direction},
        month      = ${month},
        product    = ${product},
        qty        = ${qty},
        note       = ${note || null},
        status     = ${status},
        updated_at = NOW()
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
