'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import type { Trade } from '@/lib/types';
import { STRATEGIES, TRADERS, PRODUCTS, CONTRACT_MONTHS, STRATEGY_CONFIG } from '@/lib/constants';

/* ── StatusBadge ──────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
      status === 'Synced'
        ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
        : 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200'
    }`}>
      {status}
    </span>
  );
}

/* ── Inline Edit Row ─────────────────────────────────── */
function EditRow({
  editForm,
  setEditForm,
  onSave,
  onCancel,
}: {
  editForm: Partial<Trade>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Trade>>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inp = 'px-1.5 py-1 border border-blue-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full min-w-[80px]';
  const sel = inp;
  const upd = <K extends keyof Trade>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setEditForm(f => ({ ...f, [key]: e.target.value as Trade[K] }));

  return (
    <tr className="bg-blue-50/60">
      <td className="px-2 py-2 pl-4">
        <input type="date" value={String(editForm.trade_date ?? '').slice(0, 10)} onChange={upd('trade_date')} className={inp} />
      </td>
      <td className="px-2 py-2">
        <input type="text" value={editForm.entity ?? ''} onChange={upd('entity')} className={inp} />
      </td>
      <td className="px-2 py-2">
        <input type="text" value={editForm.account ?? ''} onChange={upd('account')} className={inp} />
      </td>
      <td className="px-2 py-2">
        <select
          value={editForm.strategy ?? ''}
          onChange={e => {
            const strategy = e.target.value;
            const { entity, account } = STRATEGY_CONFIG[strategy];
            setEditForm(f => ({ ...f, strategy, entity, account }));
          }}
          className={sel}
        >
          {STRATEGIES.map(s => <option key={s}>{s}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <select value={editForm.trader ?? ''} onChange={upd('trader')} className={sel}>
          {TRADERS.map(t => <option key={t}>{t}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <select
          value={editForm.direction ?? 'Buy'}
          onChange={e => setEditForm(f => ({ ...f, direction: e.target.value as 'Buy' | 'Sell' }))}
          className={sel}
        >
          <option>Buy</option>
          <option>Sell</option>
        </select>
      </td>
      <td className="px-2 py-2">
        <select value={editForm.month ?? ''} onChange={upd('month')} className={sel}>
          {CONTRACT_MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <select value={editForm.product ?? ''} onChange={upd('product')} className={sel}>
          {PRODUCTS.map(p => <option key={p}>{p}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          step="any"
          value={String(editForm.qty ?? '')}
          onChange={e => setEditForm(f => ({ ...f, qty: parseFloat(e.target.value) }))}
          className={inp}
        />
      </td>
      <td className="px-2 py-2">
        <input type="text" value={editForm.note ?? ''} onChange={upd('note' as keyof Trade)} className={inp} />
      </td>
      <td className="px-2 py-2">
        <select
          value={editForm.status ?? 'Pending'}
          onChange={e => setEditForm(f => ({ ...f, status: e.target.value as 'Pending' | 'Synced' }))}
          className={sel}
        >
          <option>Pending</option>
          <option>Synced</option>
        </select>
      </td>
      <td className="px-2 py-2 pr-4">
        <div className="flex items-center gap-1">
          <button onClick={onSave} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" title="Save">
            <Check size={13} />
          </button>
          <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors" title="Cancel">
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Main component ──────────────────────────────────── */
const COL_HEADERS = [
  'Date', 'Entity', 'Account', 'Strategy', 'Trader',
  'Dir', 'Month', 'Product', 'QTY', 'Note', 'Status', '',
];

export default function TodaysTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trade>>({});
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trades?date=today');
      if (!res.ok) throw new Error('Failed to fetch');
      setTrades(await res.json());
    } catch {
      setError("Couldn't load today's trades.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  function startEdit(trade: Trade) {
    setEditId(trade.id);
    setEditForm({ ...trade });
    setDeleteTarget(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({});
  }

  async function saveEdit(id: number) {
    const original = trades.find(t => t.id === id);
    // Optimistic update
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...editForm } as Trade : t));
    setEditId(null);

    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated: Trade = await res.json();
      setTrades(prev => prev.map(t => t.id === id ? updated : t));
    } catch {
      // Rollback
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#E11932] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Today&apos;s Trades</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            &nbsp;·&nbsp;{trades.length} record{trades.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchTrades}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {trades.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <p className="text-sm text-gray-500">No trades entered today.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 sticky top-0">
                {COL_HEADERS.map(h => (
                  <th
                    key={h}
                    className="px-3 py-2.5 first:pl-6 last:pr-4 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {trades.map(trade =>
                editId === trade.id ? (
                  <EditRow
                    key={trade.id}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onSave={() => saveEdit(trade.id)}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <tr key={trade.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="px-3 py-2.5 pl-6 text-gray-600 whitespace-nowrap tabular-nums">
                      {String(trade.trade_date).slice(0, 10)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{trade.entity}</td>
                    <td className="px-3 py-2.5 text-gray-500">{trade.account}</td>
                    <td className="px-3 py-2.5 text-gray-700">{trade.strategy}</td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{trade.trader}</td>
                    <td className={`px-3 py-2.5 font-semibold ${trade.direction === 'Buy' ? 'text-green-600' : 'text-[#E11932]'}`}>
                      {trade.direction}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{trade.month}</td>
                    <td className="px-3 py-2.5 text-gray-700 font-medium">{trade.product}</td>
                    <td className={`px-3 py-2.5 font-mono font-semibold tabular-nums ${
                      Number(trade.qty) > 0 ? 'text-green-600' : Number(trade.qty) < 0 ? 'text-[#E11932]' : 'text-gray-600'
                    }`}>
                      {Number(trade.qty).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 max-w-[130px] truncate">{trade.note || '—'}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={trade.status} /></td>
                    <td className="px-3 py-2.5 pr-4">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(trade)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        {deleteTarget === trade.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => deleteTrade(trade.id)}
                              className="px-2 py-0.5 bg-[#E11932] text-white text-xs rounded hover:bg-[#C41529] transition-colors font-medium"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteTarget(null)}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteTarget(trade.id)}
                            className="p-1.5 text-gray-400 hover:text-[#E11932] hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
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
  );
}
