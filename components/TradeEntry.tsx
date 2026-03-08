'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { Trade } from '@/lib/types';
import {
  STRATEGIES, TRADERS, PRODUCTS, CONTRACT_MONTHS,
  DEFAULT_ENTITY, DEFAULT_ACCOUNT, getCurrentContractMonth,
} from '@/lib/constants';

/* ── helpers ─────────────────────────────────────────── */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function buildDefaultForm() {
  return {
    trade_date: getToday(),
    entity:    DEFAULT_ENTITY,
    account:   DEFAULT_ACCOUNT,
    strategy:  STRATEGIES[0],
    trader:    TRADERS[0],
    direction: 'Buy' as 'Buy' | 'Sell',
    month:     getCurrentContractMonth(),
    product:   PRODUCTS[0],
    qty:       '',
    note:      '',
  };
}

interface SummaryRow {
  entity: string;
  product: string;
  month: string;
  net_qty: number;
}

/* ── component ────────────────────────────────────────── */
export default function TradeEntry() {
  const [form, setForm] = useState(buildDefaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const qtyNum = parseFloat(form.qty);
  const qtyFilled = form.qty !== '' && !isNaN(qtyNum);
  const isQtyFlagged =
    (form.direction === 'Sell' && qtyFilled && qtyNum > 0) ||
    (form.direction === 'Buy'  && qtyFilled && qtyNum < 0);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/trades?date=today');
      if (!res.ok) return;
      const trades: Trade[] = await res.json();

      const map = new Map<string, number>();
      for (const t of trades) {
        const key = `${t.entity}||${t.product}||${t.month}`;
        map.set(key, (map.get(key) ?? 0) + Number(t.qty));
      }
      const rows: SummaryRow[] = Array.from(map.entries()).map(([key, net_qty]) => {
        const [entity, product, month] = key.split('||');
        return { entity, product, month, net_qty };
      });
      setSummary(rows);
    } catch {
      // silent — summary is non-critical
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, qty: parseFloat(form.qty) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to submit trade');
      }

      setSuccess(true);
      setForm(buildDefaultForm());
      await fetchSummary();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  /* ── field helpers ────────────────────────────────── */
  const set = (key: keyof ReturnType<typeof buildDefaultForm>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const labelCls = 'block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5';
  const readonlyCls = 'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed';
  const inputCls = 'w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11932]/40 focus:border-[#E11932] transition-colors';
  const selectCls = inputCls;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Form card ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">New Trade Entry</h2>
            <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">

            {/* ── Read-only auto-fills ── */}
            <div>
              <label className={labelCls}>Trade Date</label>
              <input type="text" value={form.trade_date} readOnly className={readonlyCls} />
            </div>
            <div>
              <label className={labelCls}>Entity</label>
              <input type="text" value={form.entity} readOnly className={readonlyCls} />
            </div>
            <div>
              <label className={labelCls}>Account</label>
              <input type="text" value={form.account} readOnly className={readonlyCls} />
            </div>

            {/* ── Dropdowns ── */}
            <div>
              <label className={labelCls}>Strategy</label>
              <select value={form.strategy} onChange={set('strategy')} className={selectCls} required>
                {STRATEGIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Trader</label>
              <select value={form.trader} onChange={set('trader')} className={selectCls} required>
                {TRADERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Buy / Sell</label>
              <select
                value={form.direction}
                onChange={e => setForm(f => ({ ...f, direction: e.target.value as 'Buy' | 'Sell' }))}
                className={selectCls}
                required
              >
                <option>Buy</option>
                <option>Sell</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Contract Month</label>
              <select value={form.month} onChange={set('month')} className={selectCls} required>
                {CONTRACT_MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Product</label>
              <select value={form.product} onChange={set('product')} className={selectCls} required>
                {PRODUCTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* ── QTY with validation ── */}
            <div>
              <label className={labelCls}>QTY</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={form.qty}
                  onChange={set('qty')}
                  placeholder="0"
                  required
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    isQtyFlagged
                      ? 'bg-red-50 border-red-400 text-red-700 focus:ring-red-200'
                      : 'bg-white border-gray-200 focus:ring-[#E11932]/40 focus:border-[#E11932]'
                  }`}
                />
                {isQtyFlagged && (
                  <AlertCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none" />
                )}
              </div>
              {isQtyFlagged && (
                <p className="mt-1 text-[11px] text-red-500">
                  {form.direction === 'Sell' ? 'Sell quantity should be negative' : 'Buy quantity should be positive'}
                </p>
              )}
            </div>

            {/* ── Note (full width) ── */}
            <div className="col-span-3">
              <label className={labelCls}>Note <span className="normal-case font-normal">(optional)</span></label>
              <input
                type="text"
                value={form.note}
                onChange={set('note')}
                placeholder="Add a note…"
                className={inputCls}
              />
            </div>
          </div>

          {/* ── Feedback messages ── */}
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

          {/* ── Submit ── */}
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

      {/* ── Live Summary Table ──────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Today&apos;s Net Position Summary</h3>
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
            {summaryLoading ? 'Loading…' : 'No trades entered today yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Entity', 'Product', 'Month', 'Net QTY'].map(h => (
                    <th
                      key={h}
                      className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 first:pl-6 last:pr-6 ${h === 'Net QTY' ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-2.5 pl-6 text-gray-700">{row.entity}</td>
                    <td className="px-5 py-2.5 text-gray-700 font-medium">{row.product}</td>
                    <td className="px-5 py-2.5 text-gray-500">{row.month}</td>
                    <td className={`px-5 py-2.5 pr-6 text-right font-mono font-semibold ${
                      row.net_qty > 0 ? 'text-green-600' : row.net_qty < 0 ? 'text-[#E11932]' : 'text-gray-500'
                    }`}>
                      {row.net_qty > 0 ? '+' : ''}{row.net_qty.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
