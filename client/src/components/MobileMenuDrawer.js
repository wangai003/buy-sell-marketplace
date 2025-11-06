import { Button, Drawer, Cascader } from 'antd';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getCategoryHierarchy } from '../actions/admin';
import queryString from 'query-string';

const MobileMenuDrawer = ({ categories }) => {
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [hierarchicalOptions, setHierarchicalOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState([]);
  const history = useHistory();

  useEffect(() => {
    loadHierarchicalCategories();
    loadFromURL();
  }, []);

  const loadHierarchicalCategories = async () => {
    try {
      const res = await getCategoryHierarchy();
      const transformedOptions = transformCategoriesToOptions(res.data || []);
      setHierarchicalOptions(transformedOptions);
    } catch (error) {
      console.error('Error loading hierarchical categories:', error);
      setHierarchicalOptions([]);
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

  const handleCategory = () => {
    setCategoryVisible(true);
  };

  const handleCategoryClose = () => {
    setCategoryVisible(false);
  };

  const handleCascaderChange = (value, selectedOptions) => {
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
    setCategoryVisible(false);
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
    <>
      <Button
        className='rounded-0'
        size='large'
        type='primary'
        onClick={handleCategory}
        style={{
          marginBottom: '16px',
          width: '90%',
          backgroundColor: '#33b27b',
          borderColor: '#33b27b',
        }}
      >
        <i class='fas fa-list-alt me-1'></i> Filter Categories
      </Button>
      <Drawer
        title='Filter by Category'
        placement={'left'}
        onClose={handleCategoryClose}
        open={categoryVisible}
        width={320}
        style={{
          background: 'linear-gradient(to bottom, var(--primary-gold), var(--secondary-white))',
        }}
        bodyStyle={{
          background: 'linear-gradient(to bottom, var(--primary-gold), var(--secondary-white))',
          padding: '20px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            fontWeight: 'bold',
            color: '#333',
            fontSize: '16px'
          }}>
            Select Category → Subcategory → Element
          </label>
          <Cascader
            options={hierarchicalOptions}
            value={selectedValue}
            onChange={handleCascaderChange}
            placeholder="Select Category → Subcategory → Element"
            showSearch={{ filter }}
            style={{ width: '100%' }}
            size="large"
            allowClear
            expandTrigger="click"
            changeOnSelect={false}
            displayRender={(labels) => labels.join(' → ')}
          />
          {selectedValue.length > 0 && (
            <Button
              type="link"
              onClick={handleClear}
              style={{ 
                marginTop: '10px',
                padding: 0,
                color: '#6c757d'
              }}
            >
              Clear Selection
            </Button>
          )}
        </div>
        <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
            Or browse all categories:
          </p>
          {categories && categories.map((c, i) => {
            return (
              <a
                key={i}
                href={`/category/${c._id}`}
                className='text-decoration-none'
                onClick={handleCategoryClose}
              >
                <div className='list-group-item side-menu rounded-0 list-group-item-action d-flex justify-content-between align-items-center'
                  style={{
                    marginBottom: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    padding: '12px',
                    backgroundColor: '#fff',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                    e.currentTarget.style.transform = 'translateX(5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div className='flex-column text-dark1'>
                    {c.name}
                    <p className='mb-1 text-small text-muted'>
                      <small>Products: {c.productCount}</small>
                    </p>
                  </div>
                  <div className='side-arrow text-muted'>
                    <i className='fas fa-chevron-right fa-sm'></i>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </Drawer>
    </>
  );
};

export default MobileMenuDrawer;
