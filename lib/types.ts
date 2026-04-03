export interface Trade {
  id: number;
  trade_date: string;
  trade_type: 'TAS' | 'Internal';
  entity: string | null;
  account: string;
  strategy: string;
  trader: string | null;
  direction: 'Buy' | 'Sell' | null;
  month: string;
  product: string;
  qty: number;
  note: string | null;
  strategy_2: string | null;
  account_2: string | null;
  gives_takes: 'Gives' | 'Takes' | null;
  price_type: 'Settle Price' | 'Type in' | null;
  price: number | null;
  status: 'Pending' | 'Synced';
  pfj_associated_id: string | null;
  created_at: string;
  updated_at: string;
}
