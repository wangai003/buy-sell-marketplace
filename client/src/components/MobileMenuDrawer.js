import { Button, Drawer } from 'antd';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getCategoryHierarchy } from '../actions/admin';
import queryString from 'query-string';

const MobileMenuDrawer = ({ categories }) => {
  const [categoryVisible, setCategoryVisible] = useState(false);
  const [hierarchicalData, setHierarchicalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubcategories, setExpandedSubcategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const history = useHistory();

  useEffect(() => {
    loadHierarchicalCategories();
  }, []);

  useEffect(() => {
    if (hierarchicalData.length > 0) {
      loadFromURL();
    }
  }, [hierarchicalData]);

  const loadHierarchicalCategories = async () => {
    try {
      setLoading(true);
      const res = await getCategoryHierarchy();
      console.log('Hierarchical data loaded:', res.data);
      if (res.data && res.data.length > 0) {
        setHierarchicalData(res.data);
      } else {
        console.warn('No hierarchical data received, using empty array');
        setHierarchicalData([]);
      }
    } catch (error) {
      console.error('Error loading hierarchical categories:', error);
      setHierarchicalData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFromURL = () => {
    const { category, subcategory, element } = queryString.parse(window.location.search);
    if (category && hierarchicalData.length > 0) {
      setSelectedCategory(category);
      setExpandedCategories({ [category]: true });
      
      const catData = hierarchicalData.find(c => c._id === category);
      if (catData && subcategory) {
        setSelectedSubcategory(subcategory);
        setExpandedSubcategories({ [subcategory]: true });
        
        if (element) {
          setSelectedElement(element);
        }
      }
    }
  };

  const handleCategory = () => {
    setCategoryVisible(true);
  };

  const handleCategoryClose = () => {
    setCategoryVisible(false);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
    // Clear subcategories and elements when collapsing
    if (expandedCategories[categoryId]) {
      if (selectedCategory === categoryId) {
        setSelectedSubcategory(null);
        setSelectedElement(null);
        setExpandedSubcategories({});
      }
    }
  };

  const toggleSubcategory = (subcategoryId) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
    // Clear element selection when collapsing
    if (expandedSubcategories[subcategoryId] && selectedSubcategory === subcategoryId) {
      setSelectedElement(null);
    }
  };

  const handleCategoryClick = (categoryId) => {
    // Just expand/collapse, don't apply filter yet
    toggleCategory(categoryId);
    // Set as selected for visual feedback
    if (!expandedCategories[categoryId]) {
      setSelectedCategory(categoryId);
      setSelectedSubcategory(null);
      setSelectedElement(null);
      setExpandedSubcategories({});
    } else {
      // If collapsing, clear selection
      if (selectedCategory === categoryId) {
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setSelectedElement(null);
      }
    }
  };

  const handleCategoryApply = (categoryId, e) => {
    e.stopPropagation(); // Prevent expand/collapse
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
    setSelectedElement(null);
    applyFilter(categoryId, null, null);
  };

  const handleSubcategoryClick = (categoryId, subcategoryId) => {
    // Just expand/collapse, don't apply filter yet
    toggleSubcategory(subcategoryId);
    // Set as selected for visual feedback
    if (!expandedSubcategories[subcategoryId]) {
      setSelectedCategory(categoryId);
      setSelectedSubcategory(subcategoryId);
      setSelectedElement(null);
    } else {
      // If collapsing, clear subcategory selection
      if (selectedSubcategory === subcategoryId) {
        setSelectedSubcategory(null);
        setSelectedElement(null);
      }
    }
  };

  const handleSubcategoryApply = (categoryId, subcategoryId, e) => {
    e.stopPropagation(); // Prevent expand/collapse
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
    setSelectedElement(null);
    applyFilter(categoryId, subcategoryId, null);
  };

  const handleElementSelect = (categoryId, subcategoryId, elementId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
    setSelectedElement(elementId);
    // Apply filter when element is selected
    applyFilter(categoryId, subcategoryId, elementId);
  };

  const applyFilter = (category, subcategory, element) => {
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
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedElement(null);
    setExpandedCategories({});
    setExpandedSubcategories({});
    const currentParams = queryString.parse(window.location.search);
    const newParams = { ...currentParams, category: '', subcategory: '', element: '' };
    history.push(`/search-result?${queryString.stringify(newParams)}`);
  };

  const getCategoryName = (categoryId) => {
    const cat = hierarchicalData.find(c => c._id === categoryId);
    return cat ? cat.name : '';
  };

  const getSubcategoryName = (categoryId, subcategoryId) => {
    const cat = hierarchicalData.find(c => c._id === categoryId);
    if (cat && cat.subcategories) {
      const sub = cat.subcategories.find(s => s._id === subcategoryId);
      return sub ? sub.name : '';
    }
    return '';
  };

  const getElementName = (categoryId, subcategoryId, elementId) => {
    const cat = hierarchicalData.find(c => c._id === categoryId);
    if (cat && cat.subcategories) {
      const sub = cat.subcategories.find(s => s._id === subcategoryId);
      if (sub && sub.elements) {
        const elem = sub.elements.find(e => e._id === elementId);
        return elem ? elem.name : '';
      }
    }
    return '';
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
        <i className='fas fa-list-alt me-1'></i> Filter Categories
      </Button>
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Filter by Category</span>
            {(selectedCategory || selectedSubcategory || selectedElement) && (
              <Button
                type="link"
                size="small"
                onClick={handleClear}
                style={{ padding: 0, fontSize: '12px', color: '#ff4d4f' }}
              >
                Clear
              </Button>
            )}
          </div>
        }
        placement={'left'}
        onClose={handleCategoryClose}
        open={categoryVisible}
        width={350}
        style={{
          background: 'linear-gradient(to bottom, var(--primary-gold), var(--secondary-white))',
        }}
        bodyStyle={{
          background: 'linear-gradient(to bottom, var(--primary-gold), var(--secondary-white))',
          padding: '16px',
        }}
      >
        {/* Selected Path Display */}
        {(selectedCategory || selectedSubcategory || selectedElement) && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            background: '#f0f7ff',
            borderRadius: '8px',
            border: '2px solid #33b27b',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>
              Selected Filter:
            </div>
            <div style={{ color: '#333', lineHeight: '1.6' }}>
              {selectedCategory && (
                <div>
                  <span style={{ fontWeight: '600', color: '#33b27b' }}>
                    {getCategoryName(selectedCategory)}
                  </span>
                  {selectedSubcategory && (
                    <>
                      <span style={{ margin: '0 6px', color: '#999' }}>→</span>
                      <span style={{ fontWeight: '600', color: '#228B22' }}>
                        {getSubcategoryName(selectedCategory, selectedSubcategory)}
                      </span>
                      {selectedElement && (
                        <>
                          <span style={{ margin: '0 6px', color: '#999' }}>→</span>
                          <span style={{ fontWeight: '600', color: '#155724' }}>
                            {getElementName(selectedCategory, selectedSubcategory, selectedElement)}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hierarchical Category List */}
        <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#33b27b', marginBottom: '15px' }}></i>
              <p style={{ color: '#666', fontSize: '14px' }}>Loading categories...</p>
            </div>
          ) : hierarchicalData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <i className="fas fa-folder-open fa-3x" style={{ color: '#999', marginBottom: '15px' }}></i>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>No categories available</p>
              <p style={{ color: '#999', fontSize: '12px' }}>Please try again later</p>
            </div>
          ) : (
            <>
              {hierarchicalData.map((category) => {
                const isCategoryExpanded = expandedCategories[category._id];
                const isCategorySelected = selectedCategory === category._id;
              
          return (
                  <div key={category._id} style={{ marginBottom: '8px' }}>
                {/* Category Level */}
                <div
                  onClick={() => handleCategoryClick(category._id)}
                  style={{
                    padding: '14px 16px',
                    background: isCategorySelected ? '#e8f5e9' : '#fff',
                    border: isCategorySelected ? '2px solid #33b27b' : '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '50px',
                    touchAction: 'manipulation',
                    position: 'relative',
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: isCategoryExpanded ? '#33b27b' : isCategorySelected ? '#33b27b' : '#f0f0f0',
                      color: (isCategoryExpanded || isCategorySelected) ? 'white' : '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginRight: '12px',
                      flexShrink: 0
                    }}>
                      {isCategoryExpanded ? '−' : '+'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: isCategorySelected ? '600' : '500',
                        fontSize: '15px',
                        color: isCategorySelected ? '#33b27b' : '#333',
                        marginBottom: '2px'
                      }}>
                        {category.name}
                      </div>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {category.subcategories.length} subcategories
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCategorySelected && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={(e) => handleCategoryApply(category._id, e)}
                        style={{
                          background: '#33b27b',
                          borderColor: '#33b27b',
                          fontSize: '11px',
                          height: '24px',
                          padding: '0 8px'
                        }}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>

                {/* Subcategories Level - Show when category is expanded */}
                {isCategoryExpanded && category.subcategories && category.subcategories.length > 0 && (
                  <div style={{ marginTop: '6px', marginLeft: '20px', borderLeft: '2px solid #33b27b', paddingLeft: '12px' }}>
                    {category.subcategories.map((subcategory) => {
                      const isSubcategoryExpanded = expandedSubcategories[subcategory._id];
                      const isSubcategorySelected = selectedSubcategory === subcategory._id;
                      
                      return (
                        <div key={subcategory._id} style={{ marginBottom: '6px' }}>
                          {/* Subcategory Level */}
                          <div
                            onClick={() => handleSubcategoryClick(category._id, subcategory._id)}
                            style={{
                              padding: '12px 14px',
                              background: isSubcategorySelected ? '#e8f5e9' : '#f8f9fa',
                              border: isSubcategorySelected ? '2px solid #228B22' : '1px solid #ddd',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              minHeight: '44px',
                              touchAction: 'manipulation',
                              position: 'relative',
                            }}
                            onTouchStart={(e) => {
                              e.currentTarget.style.transform = 'scale(0.98)';
                            }}
                            onTouchEnd={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                background: isSubcategoryExpanded ? '#228B22' : isSubcategorySelected ? '#228B22' : '#e0e0e0',
                                color: (isSubcategoryExpanded || isSubcategorySelected) ? 'white' : '#666',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                marginRight: '10px',
                                flexShrink: 0
                              }}>
                                {isSubcategoryExpanded ? '−' : '+'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontWeight: isSubcategorySelected ? '600' : '500',
                                  fontSize: '14px',
                                  color: isSubcategorySelected ? '#228B22' : '#333'
                                }}>
                                  {subcategory.name}
                                </div>
                                {subcategory.elements && subcategory.elements.length > 0 && (
                                  <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                                    {subcategory.elements.length} elements
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isSubcategorySelected && (
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={(e) => handleSubcategoryApply(category._id, subcategory._id, e)}
                                  style={{
                                    background: '#228B22',
                                    borderColor: '#228B22',
                                    fontSize: '11px',
                                    height: '24px',
                                    padding: '0 8px'
                                  }}
                                >
                                  Apply
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Elements Level - Show when subcategory is expanded */}
                          {isSubcategoryExpanded && subcategory.elements && subcategory.elements.length > 0 && (
                            <div style={{ marginTop: '6px', marginLeft: '20px', borderLeft: '2px solid #228B22', paddingLeft: '12px' }}>
                              {subcategory.elements.map((element) => {
                                const isElementSelected = selectedElement === element._id;
                                
                                return (
                                  <div
                                    key={element._id}
                                    onClick={() => handleElementSelect(category._id, subcategory._id, element._id)}
                                    style={{
                                      padding: '10px 12px',
                                      background: isElementSelected ? '#e8f5e9' : '#fff',
                                      border: isElementSelected ? '2px solid #155724' : '1px solid #e0e0e0',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      marginBottom: '4px',
                                      minHeight: '40px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      touchAction: 'manipulation',
                                    }}
                                    onTouchStart={(e) => {
                                      e.currentTarget.style.transform = 'scale(0.98)';
                                    }}
                                    onTouchEnd={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  >
                                    <div style={{
                                      fontWeight: isElementSelected ? '600' : '400',
                                      fontSize: '13px',
                                      color: isElementSelected ? '#155724' : '#333',
                                      flex: 1
                                    }}>
                                      {element.name}
                                    </div>
                                    {isElementSelected && (
                                      <i className="fas fa-check-circle" style={{ color: '#155724', fontSize: '14px', marginLeft: '8px' }}></i>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
          );
        })}
            </>
          )}
        </div>

        {/* Success Message */}
        {selectedElement && (
          <div style={{
            marginTop: '20px',
            padding: '14px',
            background: '#d4edda',
            border: '2px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            textAlign: 'center',
            fontSize: '13px'
          }}>
            <i className="fas fa-check-circle me-2" style={{ fontSize: '16px' }}></i>
            <strong>Filter Applied!</strong>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
              Viewing filtered results
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default MobileMenuDrawer;
