import React, { useEffect, useState } from 'react';
import { Cascader, Form, Tag } from 'antd';
import { getCategoryHierarchy } from '../actions/admin';

const HierarchicalSelector = ({ onSelectionChange, initialValue = [] }) => {
  const [options, setOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const [selectedLabels, setSelectedLabels] = useState([]);

  const loadCategories = async () => {
    try {
      const res = await getCategoryHierarchy();
      const transformedOptions = transformCategoriesToOptions(res.data);
      setOptions(transformedOptions);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setSelectedValue(initialValue);
  }, [initialValue]);

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
    const labels = selectedOptions ? selectedOptions.map(option => option.label) : [];
    setSelectedLabels(labels);
    onSelectionChange({
      category: category || '',
      subcategory: subcategory || '',
      element: element || '',
      categoryName: selectedOptions && selectedOptions[0] ? selectedOptions[0].label : ''
    });
  };

  const filter = (inputValue, path) => {
    return path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
  };

  return (
    <div>
      <Form.Item
        label="Category Selection"
        name="categorySelection"
        rules={[{ required: true, message: 'Please select a category, subcategory, and element' }]}
      >
        <Cascader
          options={options}
          value={selectedValue}
          onChange={handleChange}
          placeholder="Select Category → Subcategory → Element"
          showSearch={{ filter }}
          style={{ width: '100%' }}
          size="large"
          allowClear={false}
          expandTrigger="hover"
          changeOnSelect
        />
      </Form.Item>

      {selectedLabels.length > 0 && (
        <div style={{ marginTop: '8px', marginBottom: '16px' }}>
          <small style={{ color: '#666', fontWeight: '500' }}>Selected Categories:</small>
          <div style={{ marginTop: '4px' }}>
            {selectedLabels.map((label, index) => (
              <Tag
                key={index}
                color="blue"
                style={{ marginRight: '4px', marginBottom: '4px' }}
              >
                {label}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalSelector;