'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { Trade } from '@/lib/types';
import {
  STRATEGIES, TRADERS, STRATEGY_CONFIG, PRODUCTS, CONTRACT_MONTHS,
  getCurrentContractMonth,
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
  };
}

function buildInternalForm() {
  const defaultStrategy = STRATEGIES[0];
  const { account } = STRATEGY_CONFIG[defaultStrategy];
  const { account: account2 } = STRATEGY_CONFIG[STRATEGIES[1]];
  return {
    trade_type:  'Internal' as const,
    trade_date:  getToday(),
    strategy:    defaultStrategy,
    account,
    gives_takes: 'Gives' as 'Gives' | 'Takes',
    strategy_2:  STRATEGIES[1],
    account_2:   account2,
    month:       getCurrentContractMonth(),
    product:     PRODUCTS[0],
    qty:         '',
    note:        '',
  };
}

interface SummaryRow {
  entity: string;
  product: string;
  month: string;
  net_qty: number;
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
      setSummary(Array.from(map.entries()).map(([key, net_qty]) => {
        const [entity, product, month] = key.split('||');
        return { entity, product, month, net_qty };
      }));
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

  const setInt = (key: keyof ReturnType<typeof buildInternalForm>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setInternalForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let body: Record<string, unknown>;
      if (tradeType === 'TAS') {
        body = {
          ...tasForm,
          qty: tasForm.direction === 'Sell'
            ? -Math.abs(parseFloat(tasForm.qty))
            : Math.abs(parseFloat(tasForm.qty)),
        };
      } else {
        body = { ...internalForm, qty: Math.abs(parseFloat(internalForm.qty)) };
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

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header + type toggle */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">New Trade Entry</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
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
                <select
                  value={tasForm.strategy}
                  onChange={e => {
                    const strategy = e.target.value;
                    const { entity, account } = STRATEGY_CONFIG[strategy];
                    setTasForm(f => ({ ...f, strategy, entity, account }));
                  }}
                  className={selectCls}
                  required
                >
                  {STRATEGIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Trader</label>
                <select value={tasForm.trader} onChange={setTas('trader')} className={selectCls} required>
                  {TRADERS.map(t => <option key={t}>{t}</option>)}
                </select>
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
                <select value={tasForm.month} onChange={setTas('month')} className={selectCls} required>
                  {CONTRACT_MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Product</label>
                <select value={tasForm.product} onChange={setTas('product')} className={selectCls} required>
                  {PRODUCTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>QTY</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={tasForm.qty}
                  onChange={setTas('qty')}
                  placeholder="0"
                  required
                  className={inputCls}
                />
              </div>

              <div className="col-span-3">
                <label className={labelCls}>Note <span className="normal-case font-normal">(optional)</span></label>
                <input type="text" value={tasForm.note} onChange={setTas('note')} placeholder="Add a note…" className={inputCls} />
              </div>
            </div>
          ) : (
            /* ── Internal Form ────────────────────────────── */
            <div className="grid grid-cols-3 gap-x-4 gap-y-4">
              <div>
                <label className={labelCls}>Trade Date</label>
                <input type="text" value={internalForm.trade_date} readOnly className={readonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Contract Month</label>
                <select value={internalForm.month} onChange={setInt('month')} className={selectCls} required>
                  {CONTRACT_MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Product</label>
                <select value={internalForm.product} onChange={setInt('product')} className={selectCls} required>
                  {PRODUCTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {/* Strategy 1 | Gives/Takes | Strategy 2 — reads across */}
              <div>
                <label className={labelCls}>Strategy</label>
                <select
                  value={internalForm.strategy}
                  onChange={e => {
                    const strategy = e.target.value;
                    const { account } = STRATEGY_CONFIG[strategy];
                    setInternalForm(f => ({ ...f, strategy, account }));
                  }}
                  className={selectCls}
                  required
                >
                  {STRATEGIES.map(s => <option key={s}>{s}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">{internalForm.account}</p>
              </div>

              <div>
                <label className={labelCls}>Gives / Takes</label>
                <select
                  value={internalForm.gives_takes}
                  onChange={e => setInternalForm(f => ({ ...f, gives_takes: e.target.value as 'Gives' | 'Takes' }))}
                  className={selectCls}
                  required
                >
                  <option>Gives</option>
                  <option>Takes</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>Strategy</label>
                <select
                  value={internalForm.strategy_2}
                  onChange={e => {
                    const strategy_2 = e.target.value;
                    const { account: account_2 } = STRATEGY_CONFIG[strategy_2];
                    setInternalForm(f => ({ ...f, strategy_2, account_2 }));
                  }}
                  className={selectCls}
                  required
                >
                  {STRATEGIES.map(s => <option key={s}>{s}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">{internalForm.account_2}</p>
              </div>

              <div>
                <label className={labelCls}>QTY</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={internalForm.qty}
                  onChange={setInt('qty')}
                  placeholder="0"
                  required
                  className={inputCls}
                />
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Note <span className="normal-case font-normal">(optional)</span></label>
                <input type="text" value={internalForm.note} onChange={setInt('note')} placeholder="Add a note…" className={inputCls} />
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
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Entity', 'Product', 'Month', 'Net QTY'].map(h => (
                    <th key={h} className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 first:pl-6 last:pr-6 ${h === 'Net QTY' ? 'text-right' : 'text-left'}`}>
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
