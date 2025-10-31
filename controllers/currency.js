const { getRate, convertUSDCToCurrency, convertCurrencyToUSDC } = require('../utils/currency');

exports.getRates = async (req, res) => {
  try {
    const rates = {};
    const currencies = ['EURC', 'XLM', 'AKOFA', 'USDC'];
    for (const currency of currencies) {
      rates[currency] = await getRate(currency);
    }
    res.json(rates);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
};

exports.convertPrice = async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    let convertedAmount;

    if (fromCurrency === 'USDC') {
      convertedAmount = await convertUSDCToCurrency(amount, toCurrency);
    } else if (toCurrency === 'USDC') {
      convertedAmount = await convertCurrencyToUSDC(amount, fromCurrency);
    } else {
      // Convert via USDC
      const usdAmount = await convertCurrencyToUSDC(amount, fromCurrency);
      convertedAmount = await convertUSDCToCurrency(usdAmount, toCurrency);
    }

    res.json({ convertedAmount });
  } catch (error) {
    console.error('Error converting price:', error);
    res.status(500).json({ error: 'Failed to convert price' });
  }
};