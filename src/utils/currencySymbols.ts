export const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  MXN: '$',
  BRL: 'R$',
  ZAR: 'R',
  SGD: 'S$',
  HKD: 'HK$',
};

export const getCurrencySymbol = (code: string): string => {
  return currencySymbols[code] || code;
};
