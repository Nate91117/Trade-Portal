export const STRATEGIES = [
  'Basis',
  'Flat Price',
  'Spread',
  'Options',
  'HTA',
  'DP',
  'Futures Only',
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
  'Corn',
  'Soybeans',
  'Wheat',
  'Soybean Meal',
  'Soybean Oil',
  'Crude Oil',
  'Natural Gas',
  'ULSD',
  'RBOB Gasoline',
  'Ethanol',
  'DDGs',
];

export const DEFAULT_ENTITY = 'PFJ Trading LLC';
export const DEFAULT_ACCOUNT = 'PFJ-001';

function generateContractMonths(): string[] {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const result: string[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  for (let y = currentYear; y <= currentYear + 2; y++) {
    for (const m of monthNames) {
      result.push(`${m} ${String(y).slice(2)}`);
    }
  }
  return result;
}

export const CONTRACT_MONTHS = generateContractMonths();

export function getCurrentContractMonth(): string {
  const now = new Date();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${monthNames[now.getMonth()]} ${String(now.getFullYear()).slice(2)}`;
}
