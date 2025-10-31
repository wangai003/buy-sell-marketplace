import React, { useEffect, useState } from 'react';
import { Cascader, Button } from 'antd';
import { getCategoryHierarchy } from '../actions/admin';
import { useHistory } from 'react-router';
import queryString from 'query-string';
import './HierarchicalFilter.css';

const HierarchicalFilter = () => {
  const [options, setOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState([]);
  const history = useHistory();

  useEffect(() => {
    loadCategories();
    loadFromURL();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await getCategoryHierarchy();
      const transformedOptions = transformCategoriesToOptions(res.data);
      setOptions(transformedOptions);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadFromURL = () => {
    const { category, subcategory, element } = queryString.parse(window.location.search);
    if (category || subcategory || element) {
      setSelectedValue([category, subcategory, element].filter(Boolean));
    }
  };

  const transformCategoriesToOptions = (categories) => {
    return categories.map(cat => ({
      value: cat._id,
      label: cat.name,
      children: cat.subcategories ? cat.subcategories.map(sub => ({
        value: sub._id,
        label: sub.name,
        children: sub.elements ? sub.elements.map(elem => ({
          value: elem._id,
          label: elem.name,
        })) : []
      })) : []
    }));
  };

  const handleChange = (value, selectedOptions) => {
    setSelectedValue(value);
    const [category, subcategory, element] = value || [];
    const currentParams = queryString.parse(window.location.search);
    const newParams = {
      ...currentParams,
      category: category || '',
      subcategory: subcategory || '',
      element: element || '',
    };
    history.push(`/search-result?${queryString.stringify(newParams)}`);
  };

  const handleClear = () => {
    setSelectedValue([]);
    const currentParams = queryString.parse(window.location.search);
    const newParams = { ...currentParams, category: '', subcategory: '', element: '' };
    history.push(`/search-result?${queryString.stringify(newParams)}`);
  };

  const filter = (inputValue, path) => {
    return path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
  };

  return (
    <div className="hierarchical-filter mb-3">
      <div className="d-flex align-items-center gap-2">
        <Cascader
          options={options}
          value={selectedValue}
          onChange={handleChange}
          placeholder="Select Category → Subcategory → Element"
          showSearch={{ filter }}
          style={{ width: '100%', maxWidth: '400px' }}
          size="large"
          allowClear={false}
          expandTrigger="hover"
          changeOnSelect
        />
        {selectedValue.length > 0 && (
          <Button
            type="text"
            onClick={handleClear}
            size="small"
            style={{ color: '#6c757d' }}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default HierarchicalFilter;