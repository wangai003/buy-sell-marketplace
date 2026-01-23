// Currency conversion utilities
// Conversion rates to USD
export const CURRENCY_RATES = {
  USDC: 1,      // 1 USDC = 1 USD
  USDT: 1,      // 1 USDT = 1 USD
  AKOFA: 0.0428 // 1 AKOFA = 0.0428 USD
};

// Convert price from USD to selected currency
export const convertPriceToCurrency = (usdPrice, currency) => {
  const rate = CURRENCY_RATES[currency] || 1;
  return usdPrice / rate;
};

// Convert price from selected currency to USD
export const convertPriceFromCurrency = (currencyPrice, currency) => {
  const rate = CURRENCY_RATES[currency] || 1;
  return currencyPrice * rate;
};

// Get currency symbol
export const getCurrencySymbol = (currency) => {
  return currency || 'USDC';
};

