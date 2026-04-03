'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, AlertCircle, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import type { Trade } from '@/lib/types';
import SearchableSelect from './SearchableSelect';
import {
  STRATEGIES, TRADERS, STRATEGY_CONFIG, PRODUCTS, CONTRACT_MONTHS,
  getCurrentContractMonth, monthSortKey,
} from '@/lib/constants';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function buildTASForm() {
  const defaultStrategy = STRATEGIES[0];
  const { entity, account } = STRATEGY_CONFIG[defaultStrategy];
  return {
    trade_type: 'TAS' as const,
    trade_date: getToday(),
    entity,
    account,
    strategy:  defaultStrategy,
    trader:    TRADERS[0],
    direction: 'Buy' as 'Buy' | 'Sell',
    month:     getCurrentContractMonth(),
    product:   PRODUCTS[0],
    qty:       '',
    note:      '',
    pfj_associated_id: '',
  };
}

function buildInternalForm() {
  const defaultStrategy = STRATEGIES[0];
  const { account } = STRATEGY_CONFIG[defaultStrategy];
  const { account: account2 } = STRATEGY_CONFIG[STRATEGIES[1]];
  return {
    trade_type:       'Internal' as const,
    trade_date:       getToday(),
    buying_strategy:  defaultStrategy,
    buying_account:   account,
    selling_strategy: STRATEGIES[1],
    selling_account:  account2,
    month:            getCurrentContractMonth(),
    product:          PRODUCTS[0],
    qty:              '',
    price_type:       'Settle Price' as 'Settle Price' | 'Type in',
    price:            '',
    note:             '',
  };
}

interface SummaryRow {
  entity: string;
  product: string;
  month: string;
  net_qty: number;
}

/* ── CST Clock + Countdown ────────────────────────────── */
function CSTClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const cstStr = now.toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Calculate seconds until 12:45 PM CST today
  const cstNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const target = new Date(cstNow);
  target.setHours(12, 45, 0, 0);
  const diffSec = Math.floor((target.getTime() - cstNow.getTime()) / 1000);

  let countdown: string;
  let urgent = false;
  if (diffSec <= 0) {
    countdown = 'CLOSED';
  } else {
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    countdown = h > 0
      ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
      : `${m}m ${String(s).padStart(2, '0')}s`;
    if (diffSec < 300) urgent = true;
  }

  return (
    <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
      <Clock size={12} className="shrink-0" />
      <span>{cstStr} CST</span>
      <span className="text-gray-300">|</span>
      <span className={urgent ? 'text-red-500 font-bold animate-pulse' : diffSec <= 0 ? 'text-gray-400' : 'text-gray-500'}>
        {diffSec > 0 ? '12:45 in ' : ''}{countdown}
      </span>
    </div>
  );
}

const labelCls = 'block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5';
const readonlyCls = 'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed';
const inputCls = 'w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11932]/40 focus:border-[#E11932] transition-colors';
const selectCls = inputCls;

export default function TradeEntry() {
  const [tradeType, setTradeType] = useState<'TAS' | 'Internal'>('TAS');
  const [tasForm, setTasForm] = useState(buildTASForm);
  const [internalForm, setInternalForm] = useState(buildInternalForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/trades?date=today&type=TAS');
      if (!res.ok) return;
      const trades: Trade[] = await res.json();
      const map = new Map<string, number>();
      for (const t of trades) {
        const key = `${t.entity}||${t.product}||${t.month}`;
        map.set(key, (map.get(key) ?? 0) + Number(t.qty));
      }
      const rows = Array.from(map.entries()).map(([key, net_qty]) => {
        const [entity, product, month] = key.split('||');
        return { entity, product, month, net_qty };
      });
      // Sort by entity → product → month (chronological)
      rows.sort((a, b) =>
        a.entity.localeCompare(b.entity) ||
        a.product.localeCompare(b.product) ||
        (monthSortKey(a.month) - monthSortKey(b.month))
      );
      setSummary(rows);
    } catch {
      // silent
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const setTas = (key: keyof ReturnType<typeof buildTASForm>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setTasForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let body: Record<string, unknown>;
      if (tradeType === 'TAS') {
        const rawQty = parseFloat(tasForm.qty);
        if (!rawQty || rawQty <= 0) {
          throw new Error('Quantity must be greater than zero.');
        }
        body = {
          ...tasForm,
          qty: tasForm.direction === 'Sell'
            ? -Math.abs(rawQty)
            : Math.abs(rawQty),
        };
      } else {
        const rawQty = parseFloat(internalForm.qty);
        if (!rawQty || rawQty <= 0) {
          throw new Error('Quantity must be greater than zero.');
        }
        body = {
          trade_type: 'Internal',
          trade_date: internalForm.trade_date,
          strategy: internalForm.buying_strategy,
          account: internalForm.buying_account,
          strategy_2: internalForm.selling_strategy,
          account_2: internalForm.selling_account,
          month: internalForm.month,
          product: internalForm.product,
          qty: Math.abs(rawQty),
          price_type: internalForm.price_type,
          price: internalForm.price_type === 'Type in' && internalForm.price
            ? parseFloat(internalForm.price)
            : null,
          note: internalForm.note,
          gives_takes: null,
        };
      }

      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to submit trade');
      }

      setSuccess(true);
      if (tradeType === 'TAS') {
        setTasForm(buildTASForm());
        await fetchSummary();
      } else {
        setInternalForm(buildInternalForm());
      }
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Group summary rows by entity for visual separation
  const entityGroups: { entity: string; rows: SummaryRow[] }[] = [];
  let lastEntity = '';
  for (const row of summary) {
    if (row.entity !== lastEntity) {
      entityGroups.push({ entity: row.entity, rows: [row] });
      lastEntity = row.entity;
    } else {
      entityGroups[entityGroups.length - 1].rows.push(row);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header + type toggle + clock */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">New Trade Entry</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <CSTClock />
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
              {(['TAS', 'Internal'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTradeType(t); setError(null); setSuccess(false); }}
                  className={`px-5 py-2 transition-colors ${
                    tradeType === t
                      ? 'bg-[#E11932] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {tradeType === 'TAS' ? (
            /* ── TAS Form ─────────────────────────────────── */
            <div className="grid grid-cols-3 gap-x-4 gap-y-4">
              <div>
                <label className={labelCls}>Trade Date</label>
                <input type="text" value={tasForm.trade_date} readOnly className={readonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Entity</label>
                <input type="text" value={tasForm.entity} readOnly className={readonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Account</label>
                <input type="text" value={tasForm.account} readOnly className={readonlyCls} />
              </div>

              <div>
                <label className={labelCls}>Strategy</label>
                <SearchableSelect
                  options={STRATEGIES}
                  value={tasForm.strategy}
                  onChange={strategy => {
                    const { entity, account } = STRATEGY_CONFIG[strategy];
                    setTasForm(f => ({ ...f, strategy, entity, account }));
                  }}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Trader</label>
                <SearchableSelect
                  options={TRADERS}
                  value={tasForm.trader}
                  onChange={trader => setTasForm(f => ({ ...f, trader }))}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Buy / Sell</label>
                <select
                  value={tasForm.direction}
                  onChange={e => setTasForm(f => ({ ...f, direction: e.target.value as 'Buy' | 'Sell' }))}
                  className={selectCls}
                  required
                >
                  <option>Buy</option>
                  <option>Sell</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Contract Month</label>
                <SearchableSelect
                  options={CONTRACT_MONTHS}
                  value={tasForm.month}
                  onChange={month => setTasForm(f => ({ ...f, month }))}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Product</label>
                <SearchableSelect
                  options={PRODUCTS}
                  value={tasForm.product}
                  onChange={product => setTasForm(f => ({ ...f, product }))}
                  required
                />
              </div>

              <div>
                <label className={labelCls}>QTY</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={tasForm.qty}
                  onChange={setTas('qty')}
                  placeholder="0"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>PFJ Associated ID <span className="normal-case font-normal">(optional)</span></label>
                <input type="text" value={tasForm.pfj_associated_id} onChange={setTas('pfj_associated_id')} placeholder="e.g. PFJ-12345" className={inputCls} />
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Note <span className="normal-case font-normal">(optional)</span></label>
                <input type="text" value={tasForm.note} onChange={setTas('note')} placeholder="Add a note…" className={inputCls} />
              </div>
            </div>
          ) : (
            /* ── Internal Form ────────────────────────────── */
            <div className="grid grid-cols-3 gap-x-4 gap-y-4">
              <div>
                <label className={labelCls}>Trade Date</label>
                <input type="date" value={internalForm.trade_date} onChange={e => setInternalForm(f => ({ ...f, trade_date: e.target.value }))} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Contract Month</label>
                <SearchableSelect
                  options={CONTRACT_MONTHS}
                  value={internalForm.month}
                  onChange={month => setInternalForm(f => ({ ...f, month }))}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Product</label>
                <SearchableSelect
                  options={PRODUCTS}
                  value={internalForm.product}
                  onChange={product => setInternalForm(f => ({ ...f, product }))}
                  required
                />
              </div>

              {/* Buying Strategy | Selling Strategy */}
              <div>
                <label className={labelCls}>Buying Strategy</label>
                <SearchableSelect
                  options={STRATEGIES}
                  value={internalForm.buying_strategy}
                  onChange={strategy => {
                    const { account } = STRATEGY_CONFIG[strategy];
                    setInternalForm(f => ({ ...f, buying_strategy: strategy, buying_account: account }));
                  }}
                  required
                />
                <p className="mt-1 text-[11px] text-gray-400">{internalForm.buying_account}</p>
              </div>

              <div>
                <label className={labelCls}>Selling Strategy</label>
                <SearchableSelect
                  options={STRATEGIES}
                  value={internalForm.selling_strategy}
                  onChange={strategy => {
                    const { account } = STRATEGY_CONFIG[strategy];
                    setInternalForm(f => ({ ...f, selling_strategy: strategy, selling_account: account }));
                  }}
                  required
                />
                <p className="mt-1 text-[11px] text-gray-400">{internalForm.selling_account}</p>
              </div>

              <div>
                <label className={labelCls}>QTY</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={internalForm.qty}
                  onChange={e => setInternalForm(f => ({ ...f, qty: e.target.value }))}
                  placeholder="0"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Price</label>
                <select
                  value={internalForm.price_type}
                  onChange={e => setInternalForm(f => ({ ...f, price_type: e.target.value as 'Settle Price' | 'Type in', price: '' }))}
                  className={selectCls}
                  required
                >
                  <option>Settle Price</option>
                  <option>Type in</option>
                </select>
              </div>

              {internalForm.price_type === 'Type in' && (
                <div>
                  <label className={labelCls}>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={internalForm.price}
                    onChange={e => setInternalForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    required
                    className={inputCls}
                  />
                </div>
              )}

              <div className={internalForm.price_type === 'Type in' ? 'col-span-3' : 'col-span-2'}>
                <label className={labelCls}>Note <span className="normal-case font-normal">(optional)</span></label>
                <input type="text" value={internalForm.note} onChange={e => setInternalForm(f => ({ ...f, note: e.target.value }))} placeholder="Add a note…" className={inputCls} />
              </div>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-700 font-medium">Trade submitted successfully.</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#E11932] hover:bg-[#C41529] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  <Send size={15} />
                  Submit Trade
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── TAS Net Position Summary ──────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Today&apos;s TAS Net Position</h3>
          <button
            onClick={fetchSummary}
            disabled={summaryLoading}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={summaryLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {summary.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            {summaryLoading ? 'Loading…' : 'No TAS trades entered today yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Entity', 'Product', 'Month', 'Net QTY'].map(h => (
                    <th key={h} className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 first:pl-6 last:pr-6 ${h === 'Net QTY' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entityGroups.map((group, gi) => (
                  group.rows.map((row, ri) => (
                    <tr
                      key={`${group.entity}-${ri}`}
                      className={`
                        ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                        ${gi > 0 && ri === 0 ? 'border-t-2 border-gray-300' : ri > 0 ? 'border-t border-gray-100' : 'border-t border-gray-100'}
                        hover:bg-gray-50/60 transition-colors
                      `}
                    >
                      <td className="px-5 py-2.5 pl-6 text-gray-700 font-medium">
                        {ri === 0 ? row.entity : ''}
                      </td>
                      <td className="px-5 py-2.5 text-gray-700 font-medium">{row.product}</td>
                      <td className="px-5 py-2.5 text-gray-500">{row.month}</td>
                      <td className={`px-5 py-2.5 pr-6 text-right font-mono font-semibold ${
                        row.net_qty > 0 ? 'text-green-600' : row.net_qty < 0 ? 'text-[#E11932]' : 'text-gray-500'
                      }`}>
                        {row.net_qty > 0 ? '+' : ''}{row.net_qty.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
