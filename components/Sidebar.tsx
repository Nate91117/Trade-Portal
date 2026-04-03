'use client';

import { PenSquare, ArrowLeftRight, ListOrdered, BarChart2 } from 'lucide-react';
import type { Tab } from '@/app/page';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'entry',    label: 'Trade Entry',      icon: PenSquare     },
  { id: 'tas',      label: 'TAS Trades',       icon: ListOrdered   },
  { id: 'internal', label: 'Internal Trades',  icon: ArrowLeftRight },
  { id: 'net',      label: 'Net Position',     icon: BarChart2     },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo / brand */}
      <div className="px-5 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#E11932] flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold tracking-tight">PFJ</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">Pilot Flying J</p>
            <p className="text-xs text-gray-400 leading-tight">Futures Desk</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Navigation</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <li key={id}>
                <button
                  onClick={() => onTabChange(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-[#E11932] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-white' : 'text-gray-400'} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 text-center">Intercompany Futures v1.0</p>
      </div>
    </aside>
  );
}
