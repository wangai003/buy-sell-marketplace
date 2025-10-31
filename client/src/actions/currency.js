import axios from 'axios';

export const fetchConvertedPrice = async (amount, fromCurrency, toCurrency) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_API}/currency/convert`, {
      amount,
      fromCurrency,
      toCurrency,
    });
    return response.data.convertedAmount;
  } catch (error) {
    console.error('Error fetching converted price:', error);
    return amount; // Fallback to original amount
  }
};