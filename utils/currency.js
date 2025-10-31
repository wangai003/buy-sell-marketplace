/**
 * Fixed exchange rates (USD per unit of currency)
 * USDC: 1 (pegged to USD)
 * XLM: 0.10 (approximate current market rate)
 * EURC: 1.08 (pegged to EUR, approximate USD value)
 * AKOFA: 0.00428 (1 AKOFA = 0.00428 USDC)
 */
const FIXED_RATES = {
  USDC: 1,
  XLM: 0.10,
  EURC: 1.08,
  AKOFA: 0.00428
};

/**
 * Gets the fixed exchange rate for a currency.
 * @param {string} currency - The currency code (e.g., 'EURC', 'XLM', 'AKOFA')
 * @returns {Promise<number>} The exchange rate (currency per USD)
 * @throws {Error} If rate is not available
 */
async function getRate(currency) {
  if (FIXED_RATES[currency] !== undefined) {
    return FIXED_RATES[currency];
  } else {
    throw new Error(`Exchange rate for ${currency} is not available`);
  }
}

/**
 * Converts a USDC amount to the target currency.
 * @param {number} amount - The amount in USDC
 * @param {string} targetCurrency - The target currency code
 * @returns {Promise<number>} The converted amount in target currency
 */
async function convertUSDCToCurrency(amount, targetCurrency) {
  const rate = await getRate(targetCurrency);
  return amount / rate;
}

/**
 * Converts an amount from the source currency to USDC.
 * @param {number} amount - The amount in source currency
 * @param {string} sourceCurrency - The source currency code
 * @returns {Promise<number>} The converted amount in USDC
 */
async function convertCurrencyToUSDC(amount, sourceCurrency) {
  const rate = await getRate(sourceCurrency);
  return amount * rate;
}

module.exports = {
  getRate,
  convertUSDCToCurrency,
  convertCurrencyToUSDC
};