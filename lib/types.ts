export interface Trade {
  id: number;
  trade_date: string;
  entity: string;
  account: string;
  strategy: string;
  trader: string;
  direction: 'Buy' | 'Sell';
  month: string;
  product: string;
  qty: number;
  note: string | null;
  status: 'Pending' | 'Synced';
  created_at: string;
  updated_at: string;
}

export interface TradeInput {
  trade_date: string;
  entity: string;
  account: string;
  strategy: string;
  trader: string;
  direction: 'Buy' | 'Sell';
  month: string;
  product: string;
  qty: number;
  note?: string | null;
}
