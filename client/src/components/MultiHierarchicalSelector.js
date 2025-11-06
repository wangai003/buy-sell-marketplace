import React, { useEffect, useState } from 'react';
import { Cascader, Tag, Button, Space } from 'antd';
import { getCategoryHierarchy } from '../actions/admin';

const MultiHierarchicalSelector = ({ onSelectionChange, selectedCategories = [] }) => {
  const [options, setOptions] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [currentLabels, setCurrentLabels] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

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

  // Sync selectedItems with selectedCategories prop (for editing existing interests)
  useEffect(() => {
    // Initialize selectedItems from prop if provided
    // selectedCategories is an array of element IDs (category IDs at the element level)
    if (selectedCategories && selectedCategories.length > 0 && options.length > 0) {
      // Build items from element IDs by finding them in the hierarchy
      const items = [];
      selectedCategories.forEach(elementId => {
        // Find the element in the hierarchy
        let found = false;
        for (const cat of options) {
          if (cat.children) {
            for (const sub of cat.children) {
              if (sub.children) {
                const elem = sub.children.find(e => e.value === elementId);
                if (elem) {
                  items.push({
                    category: cat.value,
                    subcategory: sub.value,
                    element: elementId,
                    labels: [cat.label, sub.label, elem.label]
                  });
                  found = true;
                  break;
                }
              }
            }
            if (found) break;
          }
        }
      });
      setSelectedItems(items);
    } else if (selectedCategories && selectedCategories.length === 0) {
      // Clear items if selectedCategories is explicitly empty
      setSelectedItems([]);
    }
  }, [selectedCategories, options]);

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
    setCurrentSelection(value);
    if (selectedOptions && selectedOptions.length > 0) {
      const labels = selectedOptions.map(opt => opt.label);
      setCurrentLabels(labels);
    } else {
      setCurrentLabels([]);
    }
  };

  const handleAdd = () => {
    if (currentSelection.length === 3) {
      const [category, subcategory, element] = currentSelection;
      
      // Check if this exact combination already exists
      const exists = selectedItems.some(item => 
        item.category === category && 
        item.subcategory === subcategory && 
        item.element === element
      );

      if (exists) {
        return; // Don't add duplicates
      }

      const newItem = {
        category,
        subcategory,
        element,
        labels: [...currentLabels]
      };

      const updatedItems = [...selectedItems, newItem];
      setSelectedItems(updatedItems);
      setCurrentSelection([]);
      setCurrentLabels([]);
      
      // Extract all unique category IDs (elements) for the backend
      const categoryIds = updatedItems.map(item => item.element);
      onSelectionChange(categoryIds);
    }
  };

  const handleRemove = (index) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);
    
    // Extract all unique category IDs (elements) for the backend
    const categoryIds = updatedItems.map(item => item.element);
    onSelectionChange(categoryIds);
  };

  const filter = (inputValue, path) => {
    return path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          Select Categories of Interest (Optional)
        </label>
        <p style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginBottom: '8px',
          fontStyle: 'italic'
        }}>
          Choose categories, subcategories, and elements you're interested in. You can select multiple items.
        </p>
        <Space.Compact style={{ width: '100%' }}>
          <Cascader
            options={options}
            value={currentSelection}
            onChange={handleChange}
            placeholder="Select Category → Subcategory → Element"
            showSearch={{ filter }}
            style={{ width: '100%' }}
            size="large"
            allowClear
            expandTrigger="hover"
            changeOnSelect={false}
          />
          <Button 
            type="primary" 
            onClick={handleAdd}
            disabled={!currentSelection || currentSelection.length !== 3}
            style={{ marginLeft: '8px' }}
          >
            Add
          </Button>
        </Space.Compact>
      </div>

      {selectedItems.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            Selected Categories ({selectedItems.length}):
          </label>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: '4px',
            minHeight: '50px'
          }}>
            {selectedItems.map((item, index) => (
              <Tag
                key={index}
                closable
                onClose={() => handleRemove(index)}
                color="blue"
                style={{ 
                  margin: '4px',
                  padding: '4px 8px',
                  fontSize: '13px'
                }}
              >
                {item.labels.join(' → ')}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiHierarchicalSelector;

