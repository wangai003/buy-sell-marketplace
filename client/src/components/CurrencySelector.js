import React from 'react';
import { Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

const { Option } = Select;

const CurrencySelector = () => {
  const dispatch = useDispatch();
  const { selectedCurrency } = useSelector((state) => state.buynsellCurrency);

  const currencies = ['USDC', 'EURC', 'XLM', 'AKOFA'];

  const handleCurrencyChange = (value) => {
    dispatch({
      type: 'SET_SELECTED_CURRENCY',
      payload: value,
    });
    localStorage.setItem('selectedCurrency', value);
  };

  return (
    <Select
      value={selectedCurrency}
      onChange={handleCurrencyChange}
      style={{ width: '120px', marginLeft: '16px' }}
      bordered={false}
      placeholder="Currency"
    >
      {currencies.map((currency) => (
        <Option key={currency} value={currency}>
          {currency}
        </Option>
      ))}
    </Select>
  );
};

export default CurrencySelector;