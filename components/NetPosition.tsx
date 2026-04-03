'use client';

import { useState, useCallback } from 'react';
import { Filter, RefreshCw, AlertCircle, X } from 'lucide-react';
import type { Trade } from '@/lib/types';

function getToday() { return new Date().toISOString().split('T')[0]; }

interface NetRow {
  entity: string;
  product: string;
  month: string;
  net_qty: number;
}

export default function NetPosition() {
  const [date, setDate] = useState(getToday());
  const [rows, setRows] = useState<NetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades?date=${date}&type=TAS`);
      if (!res.ok) throw new Error('Failed to fetch');
      const trades: Trade[] = await res.json();

      const map = new Map<string, number>();
      for (const t of trades) {
        const key = `${t.entity}||${t.product}||${t.month}`;
        map.set(key, (map.get(key) ?? 0) + Number(t.qty));
      }
      setRows(Array.from(map.entries()).map(([key, net_qty]) => {
        const [entity, product, month] = key.split('||');
        return { entity, product, month, net_qty };
      }).sort((a, b) => a.entity.localeCompare(b.entity) || a.product.localeCompare(b.product)));
      setHasSearched(true);
    } catch {
      setError('Failed to load trades.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11932]/40 focus:border-[#E11932] transition-colors bg-white';

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
          <button onClick={fetchNet} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#E11932] hover:bg-[#C41529] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm">
            <Filter size={14} />
            {loading ? 'Loading…' : 'Apply'}
          </button>
          <button onClick={() => { setDate(getToday()); }} className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            Today
          </button>
          {hasSearched && (
            <button onClick={fetchNet} disabled={loading} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

      {/* Results */}
      {hasSearched && (() => {
        // Group rows by entity for visual separation (matches Trade Entry summary)
        const entityGroups: { entity: string; rows: NetRow[] }[] = [];
        let lastEntity = '';
        for (const row of rows) {
          if (row.entity !== lastEntity) {
            entityGroups.push({ entity: row.entity, rows: [row] });
            lastEntity = row.entity;
          } else {
            entityGroups[entityGroups.length - 1].rows.push(row);
          }
        }

        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">TAS Net Position</h3>
              <span className="text-xs text-gray-400">{date} · {rows.length} row{rows.length !== 1 ? 's' : ''}</span>
            </div>
            {rows.length === 0 ? (
              <div className="px-6 py-20 text-center"><p className="text-sm text-gray-500">No TAS trades found for this date.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Entity', 'Product', 'Month', 'Net QTY'].map(h => (
                        <th key={h} className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 first:pl-6 last:pr-6 ${h === 'Net QTY' ? 'text-right' : 'text-left'}`}>{h}</th>
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
        );
      })()}

      {!hasSearched && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-20 text-center">
          <Filter size={28} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Select a date and click <strong>Apply</strong> to view net positions.</p>
        </div>
      )}
    </div>
  );
}
