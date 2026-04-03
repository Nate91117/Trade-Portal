'use client';

import { useState, useCallback } from 'react';
import { Filter, Search, Download, AlertCircle, X } from 'lucide-react';
import type { Trade } from '@/lib/types';

/* ── CSV helpers ─────────────────────────────────────── */
function toCSV(trades: Trade[]): string {
  const headers = [
    'ID', 'Date', 'Type', 'Entity', 'Account', 'Strategy', 'Trader',
    'Direction', 'Month', 'Product', 'QTY', 'Note', 'Created At',
  ];
  const escape = (v: string | number | null | undefined) =>
    `"${String(v ?? '').replace(/"/g, '""')}"`;

  const rows = trades.map(t => [
    t.id, String(t.trade_date).slice(0, 10), t.trade_type, t.entity, t.account,
    t.strategy, t.trader, t.direction, t.month, t.product,
    t.qty, t.note ?? '', t.created_at,
  ].map(escape).join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Resolve buying/selling from historical gives/takes data */
function resolveBuyingSelling(trade: Trade): { buying: string; buying_acct: string; selling: string; selling_acct: string } {
  if (trade.gives_takes === 'Gives') {
    return {
      buying: trade.strategy_2 ?? '',
      buying_acct: trade.account_2 ?? '',
      selling: trade.strategy,
      selling_acct: trade.account,
    };
  }
  return {
    buying: trade.strategy,
    buying_acct: trade.account,
    selling: trade.strategy_2 ?? '',
    selling_acct: trade.account_2 ?? '',
  };
}

/* ── Main component ──────────────────────────────────── */
const TAS_HEADERS = ['Date', 'Entity', 'Account', 'Strategy', 'Trader', 'Direction', 'Month', 'Product', 'QTY', 'PFJ ID', 'Note'];
const INTERNAL_HEADERS = ['Date', 'Buying Strategy', 'Selling Strategy', 'Month', 'Product', 'QTY', 'Price', 'Price ($)', 'Note'];

function defaultDates() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 30);
  return {
    to: today.toISOString().split('T')[0],
    from: from.toISOString().split('T')[0],
  };
}

export default function HistoricalArchive() {
  const [dates, setDates] = useState(defaultDates);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'' | 'TAS' | 'Internal'>('');

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = typeFilter ? `&type=${typeFilter}` : '';
      const res = await fetch(`/api/trades?from=${dates.from}&to=${dates.to}${typeParam}`);
      if (!res.ok) throw new Error('Failed to fetch');
      setTrades(await res.json());
      setHasSearched(true);
    } catch {
      setError('Failed to load trades. Check your date range and try again.');
    } finally {
      setLoading(false);
    }
  }, [dates, typeFilter]);

  const filtered = search
    ? trades.filter(t => {
        const q = search.toLowerCase();
        return [t.entity ?? '', t.account, t.strategy, t.trader ?? '', t.product, t.month, t.direction ?? '', t.note ?? '', t.trade_type]
          .some(field => field.toLowerCase().includes(q));
      })
    : trades;

  const tasTrades = filtered.filter(t => t.trade_type === 'TAS');
  const internalTrades = filtered.filter(t => t.trade_type === 'Internal');

  function handleDownload() {
    downloadCSV(toCSV(filtered), `trades_${dates.from}_to_${dates.to}.csv`);
  }

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11932]/40 focus:border-[#E11932] transition-colors bg-white';

  return (
    <div className="space-y-4 max-w-full">
      {/* ── Controls bar ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">From</label>
            <input type="date" value={dates.from} max={dates.to} onChange={e => setDates(d => ({ ...d, from: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">To</label>
            <input type="date" value={dates.to} min={dates.from} onChange={e => setDates(d => ({ ...d, to: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as '' | 'TAS' | 'Internal')} className={inputCls}>
              <option value="">All</option>
              <option value="TAS">TAS</option>
              <option value="Internal">Internal</option>
            </select>
          </div>
          <button onClick={fetchTrades} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#E11932] hover:bg-[#C41529] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
            <Filter size={14} />
            {loading ? 'Loading…' : 'Apply'}
          </button>

          {hasSearched && (
            <>
              <div className="flex-1 min-w-[220px]">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Search</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by entity, product, trader…" className={`${inputCls} pl-8 pr-8`} />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <button onClick={handleDownload} disabled={filtered.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Download size={14} />
                Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {/* ── Results ───────────────────────────────────── */}
      {hasSearched && (
        <>
          {/* TAS trades table */}
          {(typeFilter === '' || typeFilter === 'TAS') && tasTrades.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-3.5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  TAS Trades <span className="font-normal text-gray-400">({tasTrades.length.toLocaleString()})</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {TAS_HEADERS.map(h => (
                        <th key={h} className="px-3 py-2.5 first:pl-6 last:pr-6 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tasTrades.map(trade => (
                      <tr key={trade.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-3 py-2.5 pl-6 text-gray-600 whitespace-nowrap tabular-nums">{String(trade.trade_date).slice(0, 10)}</td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{trade.entity}</td>
                        <td className="px-3 py-2.5 text-gray-500">{trade.account}</td>
                        <td className="px-3 py-2.5 text-gray-700">{trade.strategy}</td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{trade.trader}</td>
                        <td className={`px-3 py-2.5 font-semibold ${trade.direction === 'Buy' ? 'text-green-600' : 'text-[#E11932]'}`}>{trade.direction}</td>
                        <td className="px-3 py-2.5 text-gray-700">{trade.month}</td>
                        <td className="px-3 py-2.5 text-gray-700 font-medium">{trade.product}</td>
                        <td className={`px-3 py-2.5 font-mono font-semibold tabular-nums ${Number(trade.qty) > 0 ? 'text-green-600' : Number(trade.qty) < 0 ? 'text-[#E11932]' : 'text-gray-600'}`}>
                          {Number(trade.qty).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs">{trade.pfj_associated_id || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-400 max-w-[160px] truncate pr-6">{trade.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Internal trades table */}
          {(typeFilter === '' || typeFilter === 'Internal') && internalTrades.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-3.5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  Internal Trades <span className="font-normal text-gray-400">({internalTrades.length.toLocaleString()})</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {INTERNAL_HEADERS.map(h => (
                        <th key={h} className="px-3 py-2.5 first:pl-6 last:pr-6 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {internalTrades.map(trade => {
                      const bs = resolveBuyingSelling(trade);
                      return (
                        <tr key={trade.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-3 py-2.5 pl-6 text-gray-600 whitespace-nowrap tabular-nums">{String(trade.trade_date).slice(0, 10)}</td>
                          <td className="px-3 py-2.5 text-gray-700">
                            <div className="font-medium">{bs.buying}</div>
                            <div className="text-[11px] text-gray-400">{bs.buying_acct}</div>
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">
                            <div className="font-medium">{bs.selling}</div>
                            <div className="text-[11px] text-gray-400">{bs.selling_acct}</div>
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">{trade.month}</td>
                          <td className="px-3 py-2.5 text-gray-700 font-medium">{trade.product}</td>
                          <td className="px-3 py-2.5 font-mono font-semibold tabular-nums text-gray-700">{Number(trade.qty).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-gray-500">{trade.price_type || '—'}</td>
                          <td className="px-3 py-2.5 text-gray-700 font-mono tabular-nums">
                            {trade.price_type === 'Type in' && trade.price != null ? `$${Number(trade.price).toFixed(2)}` : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 max-w-[160px] truncate pr-6">{trade.note || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-20 text-center">
              <p className="text-sm text-gray-500">No trades found for the selected criteria.</p>
            </div>
          )}
        </>
      )}

      {/* ── Prompt to search ──────────────────────────── */}
      {!hasSearched && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-20 text-center">
          <Filter size={28} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Select a date range above and click <strong>Apply</strong> to load trades.</p>
        </div>
      )}
    </div>
  );
}
