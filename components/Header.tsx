import { TrendingUp, User, LogOut } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-[#E11932]/10 flex items-center justify-center">
          <TrendingUp size={15} className="text-[#E11932]" />
        </div>
        <h1 className="text-base font-semibold text-gray-900 tracking-tight">
          Intercompany Futures Portal
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
          <div className="w-6 h-6 rounded-full bg-[#E11932]/10 flex items-center justify-center">
            <User size={13} className="text-[#E11932]" />
          </div>
          <span className="text-sm text-gray-700 font-medium">Trader</span>
        </div>
        <button
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
