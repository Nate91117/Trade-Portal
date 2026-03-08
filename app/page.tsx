'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TradeEntry from '@/components/TradeEntry';
import TodaysTrades from '@/components/TodaysTrades';
import HistoricalArchive from '@/components/HistoricalArchive';

export type Tab = 'entry' | 'today' | 'archive';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('entry');

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'entry' && <TradeEntry />}
          {activeTab === 'today' && <TodaysTrades />}
          {activeTab === 'archive' && <HistoricalArchive />}
        </main>
      </div>
    </div>
  );
}
