CREATE TABLE IF NOT EXISTS trades (
  id          SERIAL PRIMARY KEY,
  trade_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  trade_type  TEXT NOT NULL DEFAULT 'TAS' CHECK (trade_type IN ('TAS', 'Internal')),
  entity      TEXT,
  account     TEXT NOT NULL,
  strategy    TEXT NOT NULL,
  trader      TEXT,
  direction   TEXT CHECK (direction IN ('Buy', 'Sell')),
  month       TEXT NOT NULL,
  product     TEXT NOT NULL,
  qty         NUMERIC NOT NULL,
  note        TEXT,
  -- Internal trade fields
  strategy_2  TEXT,
  account_2   TEXT,
  gives_takes TEXT CHECK (gives_takes IN ('Gives', 'Takes')),
  price_type  TEXT CHECK (price_type IN ('Settle Price', 'Type in')),
  price       NUMERIC,
  status      TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Synced')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
