'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Check, X, RefreshCw, AlertCircle, Filter, SlidersHorizontal } from 'lucide-react';
import type { Trade } from '@/lib/types';
import { STRATEGIES, PRODUCTS, CONTRACT_MONTHS, STRATEGY_CONFIG } from '@/lib/constants';

function getToday() { return new Date().toISOString().split('T')[0]; }

const STATUSES = ['Pending', 'Synced'];
const GIVES_TAKES = ['Gives', 'Takes'];

interface Filters {
  strategy: string;
  gives_takes: string;
  strategy_2: string;
  product: string;
  month: string;
  status: string;
}

const EMPTY_FILTERS: Filters = { strategy: '', gives_takes: '', strategy_2: '', product: '', month: '', status: '' };

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
      status === 'Synced' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200'
    }`}>{status}</span>
  );
}

function EditRow({ editForm, setEditForm, onSave, onCancel }: {
  editForm: Partial<Trade>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Trade>>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inp = 'px-1.5 py-1 border border-blue-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full min-w-[80px]';
  const upd = <K extends keyof Trade>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setEditForm(f => ({ ...f, [key]: e.target.value as Trade[K] }));

  return (
    <tr className="bg-blue-50/60">
      <td className="px-2 py-2 pl-4">
        <input type="date" value={String(editForm.trade_date ?? '').slice(0, 10)} onChange={upd('trade_date')} className={inp} />
      </td>
      <td className="px-2 py-2">
        <select value={editForm.strategy ?? ''} onChange={e => {
          const strategy = e.target.value;
          const { account } = STRATEGY_CONFIG[strategy];
          setEditForm(f => ({ ...f, strategy, account }));
        }} className={inp}>
          {STRATEGIES.map(s => <option key={s}>{s}</option>)}
        </select>
        <p className="text-[10px] text-gray-400 mt-0.5">{editForm.account}</p>
      </td>
      <td className="px-2 py-2">
        <select value={editForm.gives_takes ?? 'Gives'} onChange={e => setEditForm(f => ({ ...f, gives_takes: e.target.value as 'Gives' | 'Takes' }))} className={inp}>
          <option>Gives</option>
          <option>Takes</option>
        </select>
      </td>
      <td className="px-2 py-2">
        <select value={editForm.strategy_2 ?? ''} onChange={e => {
          const strategy_2 = e.target.value;
          const { account: account_2 } = STRATEGY_CONFIG[strategy_2];
          setEditForm(f => ({ ...f, strategy_2, account_2 }));
        }} className={inp}>
          {STRATEGIES.map(s => <option key={s}>{s}</option>)}
        </select>
        <p className="text-[10px] text-gray-400 mt-0.5">{editForm.account_2}</p>
      </td>
      <td className="px-2 py-2">
        <select value={editForm.month ?? ''} onChange={upd('month')} className={inp}>
          {CONTRACT_MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <select value={editForm.product ?? ''} onChange={upd('product')} className={inp}>
          {PRODUCTS.map(p => <option key={p}>{p}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <input type="number" step="any" min="0" value={String(editForm.qty ?? '')} onChange={e => setEditForm(f => ({ ...f, qty: parseFloat(e.target.value) }))} className={inp} />
      </td>
      <td className="px-2 py-2">
        <input type="text" value={editForm.note ?? ''} onChange={upd('note' as keyof Trade)} className={inp} />
      </td>
      <td className="px-2 py-2">
        <select value={editForm.status ?? 'Pending'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as 'Pending' | 'Synced' }))} className={inp}>
          <option>Pending</option>
          <option>Synced</option>
        </select>
      </td>
      <td className="px-2 py-2 pr-4">
        <div className="flex items-center gap-1">
          <button onClick={onSave} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"><Check size={13} /></button>
          <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"><X size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

const COL_HEADERS = ['Date', 'Strategy 1', 'Gives/Takes', 'Strategy 2', 'Month', 'Product', 'QTY', 'Note', 'Status', ''];

export default function InternalTradesTab() {
  const [date, setDate] = useState(getToday());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trade>>({});
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades?date=${date}&type=Internal`);
      if (!res.ok) throw new Error('Failed to fetch');
      setTrades(await res.json());
    } catch {
      setError("Couldn't load internal trades.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const setFilter = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilters(f => ({ ...f, [key]: e.target.value }));

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filtered = trades.filter(t =>
    (!filters.strategy    || t.strategy    === filters.strategy)    &&
    (!filters.gives_takes || t.gives_takes === filters.gives_takes) &&
    (!filters.strategy_2  || t.strategy_2  === filters.strategy_2)  &&
    (!filters.product     || t.product     === filters.product)     &&
    (!filters.month       || t.month       === filters.month)       &&
    (!filters.status      || t.status      === filters.status)
  );

  function startEdit(trade: Trade) { setEditId(trade.id); setEditForm({ ...trade }); setDeleteTarget(null); }
  function cancelEdit() { setEditId(null); setEditForm({}); }

  async function saveEdit(id: number) {
    const original = trades.find(t => t.id === id);
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...editForm } as Trade : t));
    setEditId(null);
    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, trade_type: 'Internal' }),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated: Trade = await res.json();
      setTrades(prev => prev.map(t => t.id === id ? updated : t));
    } catch {
      if (original) setTrades(prev => prev.map(t => t.id === id ? original : t));
      setError('Failed to save — changes rolled back.');
    }
  }

  async function deleteTrade(id: number) {
    const snapshot = [...trades];
    setTrades(prev => prev.filter(t => t.id !== id));
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/trades/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch {
      setTrades(snapshot);
      setError('Failed to delete — trade restored.');
    }
  }

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11932]/40 focus:border-[#E11932] transition-colors bg-white';
  const filterSelectCls = 'px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E11932]/40 focus:border-[#E11932] transition-colors text-gray-700';

  return (
    <div className="space-y-4">
      {/* Date + filter controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
          <button onClick={fetchTrades} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#E11932] hover:bg-[#C41529] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm">
            <Filter size={14} />{loading ? 'Loading…' : 'Apply'}
          </button>
          <button onClick={() => setDate(getToday())} className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            Today
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 ml-auto px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showFilters || activeFilterCount > 0
                ? 'border-[#E11932] text-[#E11932] bg-red-50'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters{activeFilterCount > 0 && <span className="ml-1 bg-[#E11932] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 items-center">
              <select value={filters.strategy} onChange={setFilter('strategy')} className={filterSelectCls}>
                <option value="">All Strategy 1</option>
                {STRATEGIES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={filters.gives_takes} onChange={setFilter('gives_takes')} className={filterSelectCls}>
                <option value="">Gives & Takes</option>
                {GIVES_TAKES.map(g => <option key={g}>{g}</option>)}
              </select>
              <select value={filters.strategy_2} onChange={setFilter('strategy_2')} className={filterSelectCls}>
                <option value="">All Strategy 2</option>
                {STRATEGIES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={filters.product} onChange={setFilter('product')} className={filterSelectCls}>
                <option value="">All Products</option>
                {PRODUCTS.map(p => <option key={p}>{p}</option>)}
              </select>
              <select value={filters.month} onChange={setFilter('month')} className={filterSelectCls}>
                <option value="">All Months</option>
                {CONTRACT_MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
              <select value={filters.status} onChange={setFilter('status')} className={filterSelectCls}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              {activeFilterCount > 0 && (
                <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs text-gray-400 hover:text-gray-700 underline ml-1">
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Internal Trades</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {date} · {filtered.length}{filtered.length !== trades.length ? ` of ${trades.length}` : ''} record{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={fetchTrades} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#E11932] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-sm text-gray-500">{trades.length === 0 ? 'No internal trades for this date.' : 'No trades match the current filters.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  {COL_HEADERS.map(h => (
                    <th key={h} className="px-3 py-2.5 first:pl-6 last:pr-4 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(trade =>
                  editId === trade.id ? (
                    <EditRow key={trade.id} editForm={editForm} setEditForm={setEditForm} onSave={() => saveEdit(trade.id)} onCancel={cancelEdit} />
                  ) : (
                    <tr key={trade.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="px-3 py-2.5 pl-6 text-gray-600 whitespace-nowrap tabular-nums">{String(trade.trade_date).slice(0, 10)}</td>
                      <td className="px-3 py-2.5 text-gray-700">
                        <div className="font-medium">{trade.strategy}</div>
                        <div className="text-[11px] text-gray-400">{trade.account}</div>
                      </td>
                      <td className={`px-3 py-2.5 font-semibold ${trade.gives_takes === 'Gives' ? 'text-[#E11932]' : 'text-green-600'}`}>
                        {trade.gives_takes}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">
                        <div className="font-medium">{trade.strategy_2}</div>
                        <div className="text-[11px] text-gray-400">{trade.account_2}</div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{trade.month}</td>
                      <td className="px-3 py-2.5 text-gray-700 font-medium">{trade.product}</td>
                      <td className="px-3 py-2.5 font-mono font-semibold tabular-nums text-gray-700">{Number(trade.qty).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-gray-400 max-w-[130px] truncate">{trade.note || '—'}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={trade.status} /></td>
                      <td className="px-3 py-2.5 pr-4">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(trade)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={13} /></button>
                          {deleteTarget === trade.id ? (
                            <div className="flex items-center gap-1 ml-1">
                              <button onClick={() => deleteTrade(trade.id)} className="px-2 py-0.5 bg-[#E11932] text-white text-xs rounded hover:bg-[#C41529] font-medium">Confirm</button>
                              <button onClick={() => setDeleteTarget(null)} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteTarget(trade.id)} className="p-1.5 text-gray-400 hover:text-[#E11932] hover:bg-red-50 rounded transition-colors"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
