export const STRATEGIES = [
  'Strategy 1',
  'Strategy 2',
  'Strategy 3',
  'Strategy 4',
  'Strategy 5',
  'Strategy 6',
  'Strategy 7',
  'Strategy 8',
  'Strategy 9',
  'Strategy 10',
  'Strategy West 1',
  'Strategy West 2',
  'Strategy West 3',
  'Strategy West 4',
  'Strategy West 5',
];

export const TRADERS = [
  'John Smith',
  'Jane Doe',
  'Mike Johnson',
  'Sarah Williams',
  'Tom Davis',
  'Emily Carter',
];

export const PRODUCTS = [
  'HO - Diesel',
  'RB - Gasoline',
  'C - Corn',
];

export interface StrategyConfig {
  account: string;
  entity: string;
}

export const STRATEGY_CONFIG: Record<string, StrategyConfig> = {
  'Strategy 1':  { account: 'PFJ-001', entity: 'Tartan' },
  'Strategy 2':  { account: 'PFJ-002', entity: 'Tartan' },
  'Strategy 3':  { account: 'PFJ-003', entity: 'Tartan' },
  'Strategy 4':  { account: 'PFJ-004', entity: 'PTC' },
  'Strategy 5':  { account: 'PFJ-005', entity: 'PTC' },
  'Strategy 6':  { account: 'PFJ-006', entity: 'PTC' },
  'Strategy 7':  { account: 'PFJ-007', entity: 'PTC' },
  'Strategy 8':  { account: 'PFJ-008', entity: 'PTC' },
  'Strategy 9':  { account: 'PFJ-009', entity: 'PTC' },
  'Strategy 10': { account: 'PFJ-010', entity: 'PTC' },
  'Strategy West 1': { account: 'GAM-001', entity: 'GAM' },
  'Strategy West 2': { account: 'GAM-002', entity: 'GAM' },
  'Strategy West 3': { account: 'GAM-003', entity: 'GAM' },
  'Strategy West 4': { account: 'GAM-004', entity: 'GAM' },
  'Strategy West 5': { account: 'GAM-005', entity: 'GAM' },
};

const CME_CODES: Record<number, string> = {
  0: 'F', 1: 'G', 2: 'H', 3: 'J', 4: 'K', 5: 'M',
  6: 'N', 7: 'Q', 8: 'U', 9: 'V', 10: 'X', 11: 'Z',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function generateContractMonths(): string[] {
  const result: string[] = [];
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();
  for (let i = 0; i < 12; i++) {
    result.push(`${CME_CODES[month]} - ${MONTH_NAMES[month]} ${year}`);
    month++;
    if (month === 12) { month = 0; year++; }
  }
  return result;
}

export const CONTRACT_MONTHS = generateContractMonths();

export function getCurrentContractMonth(): string {
  const now = new Date();
  const m = now.getMonth();
  return `${CME_CODES[m]} - ${MONTH_NAMES[m]} ${now.getFullYear()}`;
}
