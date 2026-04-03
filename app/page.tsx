'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TradeEntry from '@/components/TradeEntry';
import TASTradesTab from '@/components/TASTradesTab';
import InternalTradesTab from '@/components/InternalTradesTab';
import NetPosition from '@/components/NetPosition';

export type Tab = 'entry' | 'tas' | 'internal' | 'net';

function getToday() { return new Date().toISOString().split('T')[0]; }

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('entry');
  const [filterDate, setFilterDate] = useState(getToday);

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'entry'    && <TradeEntry />}
          {activeTab === 'tas'      && <TASTradesTab date={filterDate} onDateChange={setFilterDate} />}
          {activeTab === 'internal' && <InternalTradesTab date={filterDate} onDateChange={setFilterDate} />}
          {activeTab === 'net'      && <NetPosition date={filterDate} onDateChange={setFilterDate} />}
        </main>
      </div>
    </div>
  );
}
