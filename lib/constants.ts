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
];

export const TRADERS = [
  'John Smith',
  'Jane Doe',
  'Mike Johnson',
  'Sarah Williams',
  'Tom Davis',
  'Emily Carter',
];

export const ACCOUNTS = [
  'PFJ-001',
  'PFJ-002',
  'PFJ-003',
  'PFJ-004',
  'PFJ-005',
  'PFJ-006',
  'PFJ-007',
  'PFJ-008',
  'PFJ-009',
  'PFJ-010',
];

export const PRODUCTS = [
  'HO - Diesel',
  'RB - Gasoline',
  'C - Corn',
];

export const DEFAULT_ENTITY = 'PFJ Trading LLC';
export const DEFAULT_ACCOUNT = 'PFJ-001';

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
