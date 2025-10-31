export const currencyReducer = (state = { selectedCurrency: 'USDC', rates: {} }, action) => {
  switch (action.type) {
    case 'SET_SELECTED_CURRENCY':
      return { ...state, selectedCurrency: action.payload };
    case 'SET_RATES':
      return { ...state, rates: action.payload };
    default:
      return state;
  }
};