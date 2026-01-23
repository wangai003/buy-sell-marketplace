import React, { useState, useEffect, useCallback } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { isAuthenticated } from '../actions/auth';
import { getProductsForYou } from '../actions/product';
import { getStoresForYou, updateProfile, updateUser } from '../actions/user';
import { Tabs, Card, Avatar, Empty, Pagination, Tag, message, Modal, Button } from 'antd';
import { ShopOutlined, ShoppingOutlined } from '@ant-design/icons';
import MultiHierarchicalSelector from '../components/MultiHierarchicalSelector';
import { useSelector } from 'react-redux';
import { convertPriceToCurrency, getCurrencySymbol } from '../utils/currency';

const ForYou = () => {
  const { user, token } = isAuthenticated();
  const history = useHistory();
  const { selectedCurrency } = useSelector((state) => state.buynsellCurrency);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentStorePage, setCurrentStorePage] = useState(1);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const countPerPage = 12;

  const loadForYouContent = useCallback(async () => {
    if (!user || !token) return;
    
    // Load both products and stores in parallel
    setLoadingProducts(true);
    setLoadingStores(true);
    
    try {
      const [productsRes, storesRes] = await Promise.allSettled([
        getProductsForYou(user._id, token),
        getStoresForYou(user._id, token)
      ]);

      // Handle products result
      if (productsRes.status === 'fulfilled') {
        const productsData = productsRes.value.data || [];
        setProducts(productsData);
        if (productsData.length === 0 && activeTab === 'products') {
          // Don't show error for empty results, just show empty state
        }
      } else {
        console.error('Error loading products:', productsRes.reason);
        setProducts([]);
        // Only show error if we're on the products tab and it's a real error
        if (activeTab === 'products' && productsRes.reason?.response?.status !== 404) {
          message.error('Failed to load products. Please try again.');
        }
      }

      // Handle stores result
      if (storesRes.status === 'fulfilled') {
        const storesData = storesRes.value.data || [];
        setStores(storesData);
        if (storesData.length === 0 && activeTab === 'stores') {
          // Don't show error for empty results, just show empty state
        }
      } else {
        console.error('Error loading stores:', storesRes.reason);
        setStores([]);
        // Only show error if we're on the stores tab and it's a real error
        if (activeTab === 'stores' && storesRes.reason?.response?.status !== 404) {
          message.error('Failed to load stores. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error loading For You content:', err);
      setProducts([]);
      setStores([]);
    } finally {
      setLoadingProducts(false);
      setLoadingStores(false);
    }
  }, [user?._id, token, activeTab]);

  useEffect(() => {
    if (!user || !token) {
      message.warning('Please login to view personalized recommendations');
      history.push('/login');
      return;
    }

    // Show modal if user doesn't have interested categories
    if (!user.interestedCategories || user.interestedCategories.length === 0) {
      setShowInterestModal(true);
    } else {
      loadForYouContent();
    }
  }, [user?._id, user?.interestedCategories?.length, token, history, loadForYouContent]);


  const formatNumber = (num) => {
    var re = '\\d(?=(\\d{3})+)';
    return num.toFixed(0).replace(new RegExp(re, 'g'), '$&,');
  };

  const getPaginationData = () => {
    const from = (currentPage - 1) * countPerPage;
    const to = from + countPerPage;
    return products.slice(from, to);
  };

  const getStorePaginationData = () => {
    const from = (currentStorePage - 1) * countPerPage;
    const to = from + countPerPage;
    return stores.slice(from, to);
  };

  const handleStoreClick = (storeId) => {
    history.push(`/user/${storeId}`);
  };

  const handleInterestChange = (categoryIds) => {
    setSelectedInterests(categoryIds);
  };

  const handleSubmitInterests = async () => {
    if (selectedInterests.length === 0) {
      message.warning('Please select at least one category of interest');
      return;
    }

    setSubmitting(true);
    try {
      const updatedUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        location: user.location,
        photo: user.photo,
        wallet: user.wallet,
        interestedCategories: selectedInterests,
      };

      const res = await updateProfile(user._id, updatedUser, token);
      
      // Update localStorage with new user data
      updateUser(res.data);
      
      message.success('Your interests have been saved! Loading personalized recommendations...');
      setShowInterestModal(false);
      
      // Reload the For You content after a short delay to ensure state is updated
      setTimeout(() => {
        loadForYouContent();
      }, 500);
    } catch (error) {
      console.error('Error updating interests:', error);
      message.error('Failed to save your interests. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    // Don't allow closing the modal without selecting interests
    message.info('Please select your interests to see personalized recommendations');
  };

  if (!user || !token) {
    return null;
  }

  return (
    <div className='container-fluid mb-5' style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)' }}>
      <div className='col-md-10 mx-auto mt-5'>
        <div className='card rounded-0 profile-card card-shadow mb-4' style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        }}>
          <div className='card-header p-4' style={{ borderBottom: '2px solid #FFD700', background: 'linear-gradient(to right, #FFD700, #FFFFFF)' }}>
            <h2 style={{ color: '#228B22', margin: 0 }}>
              <i className='fas fa-heart me-2'></i>For You
            </h2>
            <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>
              Personalized recommendations based on your interests
            </p>
          </div>

          <div className='card-body p-4'>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type='card'
              size='large'
              items={[
                {
                  key: 'products',
                  label: (
                    <span>
                      <ShoppingOutlined />
                      Products ({products.length})
                    </span>
                  ),
                  children: (
                    <>
                      {loadingProducts ? (
                  <div className='text-center p-5'>
                    <i className='fas fa-spinner fa-spin fa-3x' style={{ color: '#FFD700' }}></i>
                    <p style={{ marginTop: '15px', color: '#666' }}>Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <p>No products found matching your interests</p>
                        <p style={{ fontSize: '12px', color: '#999' }}>
                          Try updating your interests or check back later
                        </p>
                      </div>
                    }
                  />
                ) : (
                  <>
                    <div className='row'>
                      {getPaginationData().map((p, i) => (
                        <div className='col-md-3 mb-4' key={i}>
                          <div className='card card-shadow rounded-0' style={{ height: '100%', transition: 'transform 0.3s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <div className='product-img'>
                              <Link to={`/product/${p._id}`} className='text-decoration-none'>
                                <img
                                  src={p.images && p.images.length > 0 ? p.images[0] : '/placeholder.png'}
                                  className='card-img-top'
                                  alt={p.name}
                                  style={{ height: '200px', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.src = '/placeholder.png';
                                  }}
                                />
                                {p.images && p.images.length > 1 && (
                                  <span className='product-img-count'>
                                    <span className='badge badge-pill opacity'>
                                      {p.images.length}
                                      <i className='fas fa-images ps-1'></i>
                                    </span>
                                  </span>
                                )}
                              </Link>
                            </div>
                            <div className='card-body'>
                              <Link to={`/product/${p._id}`} className='text-decoration-none'>
                                <h6 className='card-title text-dark1' style={{ minHeight: '40px' }}>
                                  {p.name.length > 50 ? p.name.substring(0, 50) + '...' : p.name}
                                </h6>
                              </Link>
                              <div className='d-flex justify-content-between align-items-center mt-2'>
                                <span className='text-success' style={{ fontWeight: 'bold' }}>
                                  {getCurrencySymbol(selectedCurrency)}{formatNumber(parseInt(convertPriceToCurrency(p.price, selectedCurrency || 'USDC')))}
                                </span>
                                <Link to={`/user/${p.author._id}`} className='text-decoration-none'>
                                  <small className='text-muted'>
                                    {p.author.canSell && p.author.businessName
                                      ? p.author.businessName
                                      : p.author.username}
                                  </small>
                                </Link>
                              </div>
                              <div className='mt-2'>
                                <Tag color='blue' style={{ fontSize: '11px' }}>
                                  {p.category.name}
                                </Tag>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {products.length > countPerPage && (
                      <div className='text-center mt-4'>
                        <Pagination
                          current={currentPage}
                          total={products.length}
                          pageSize={countPerPage}
                          onChange={(page) => setCurrentPage(page)}
                          showSizeChanger={false}
                        />
                      </div>
                    )}
                    </>
                  )}
                  </>
                  )
                },
                {
                  key: 'stores',
                  label: (
                    <span>
                      <ShopOutlined />
                      Stores ({stores.length})
                    </span>
                  ),
                  children: (
                    <>
                      {loadingStores ? (
                  <div className='text-center p-5'>
                    <i className='fas fa-spinner fa-spin fa-3x' style={{ color: '#FFD700' }}></i>
                    <p style={{ marginTop: '15px', color: '#666' }}>Loading stores...</p>
                  </div>
                ) : stores.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <p>No stores found matching your interests</p>
                        <p style={{ fontSize: '12px', color: '#999' }}>
                          Try updating your interests or check back later
                        </p>
                      </div>
                    }
                  />
                ) : (
                  <>
                    <div className='row'>
                      {getStorePaginationData().map((store, i) => {
                        const displayLogo = store.businessLogo || store.photo;
                        const displayName = store.businessName || store.name;
                        const displayPhone = store.businessPhone || store.phone;
                        return (
                          <div className='col-md-4 mb-4' key={i}>
                            <Card
                              hoverable
                              className='card-shadow'
                              style={{
                                borderRadius: '10px',
                                transition: 'transform 0.3s ease',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleStoreClick(store._id)}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                              <div className='text-center'>
                                <Avatar
                                  src={displayLogo}
                                  size={80}
                                  style={{
                                    border: store.businessLogo ? '3px solid #FFD700' : '2px solid #ddd',
                                    marginBottom: '15px',
                                  }}
                                >
                                  {displayName[0]}
                                </Avatar>
                                <h5 style={{ color: '#228B22', fontWeight: 'bold', marginBottom: '5px' }}>
                                  {store.businessName && (
                                    <i className='fas fa-store me-2'></i>
                                  )}
                                  {displayName}
                                </h5>
                                {store.businessName && (
                                  <small style={{ color: '#666' }}>({store.username})</small>
                                )}
                                <div className='mt-3'>
                                  <p style={{ margin: '5px 0', color: '#333' }}>
                                    <i className='fas fa-phone me-2' style={{ color: '#228B22' }}></i>
                                    {displayPhone}
                                  </p>
                                  {store.socialMediaLinks && Object.keys(store.socialMediaLinks).length > 0 && (
                                    <div className='mt-2' style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                      {store.socialMediaLinks.facebook && (
                                        <a href={store.socialMediaLinks.facebook} target='_blank' rel='noopener noreferrer' style={{ fontSize: '18px', color: '#1877F2' }}>
                                          <i className='fab fa-facebook'></i>
                                        </a>
                                      )}
                                      {store.socialMediaLinks.instagram && (
                                        <a href={store.socialMediaLinks.instagram} target='_blank' rel='noopener noreferrer' style={{ fontSize: '18px', color: '#E4405F' }}>
                                          <i className='fab fa-instagram'></i>
                                        </a>
                                      )}
                                      {store.socialMediaLinks.twitter && (
                                        <a href={store.socialMediaLinks.twitter} target='_blank' rel='noopener noreferrer' style={{ fontSize: '18px', color: '#1DA1F2' }}>
                                          <i className='fab fa-twitter'></i>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {store.sellerCategories && store.sellerCategories.length > 0 && (
                                    <div className='mt-3'>
                                      <small style={{ color: '#666', display: 'block', marginBottom: '5px' }}>
                                        Categories ({store.sellerCategories.length}):
                                      </small>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                                        {store.sellerCategories.slice(0, 3).map((cat, idx) => (
                                          <Tag key={idx} color='gold' style={{ fontSize: '10px' }}>
                                            {cat.name || cat}
                                          </Tag>
                                        ))}
                                        {store.sellerCategories.length > 3 && (
                                          <Tag color='default' style={{ fontSize: '10px' }}>
                                            +{store.sellerCategories.length - 3}
                                          </Tag>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                    {stores.length > countPerPage && (
                      <div className='text-center mt-4'>
                        <Pagination
                          current={currentStorePage}
                          total={stores.length}
                          pageSize={countPerPage}
                          onChange={(page) => setCurrentStorePage(page)}
                          showSizeChanger={false}
                        />
                      </div>
                    )}
                    </>
                  )}
                    </>
                  )
                }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Interest Selection Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <i className='fas fa-heart' style={{ color: '#ff6b6b', marginRight: '8px' }}></i>
            Select Your Interests
          </div>
        }
        open={showInterestModal}
        onCancel={handleModalCancel}
        footer={[
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmitInterests}
            loading={submitting}
            disabled={selectedInterests.length === 0}
            style={{
              background: 'linear-gradient(to right, #33b27b, #28a745)',
              border: 'none',
              borderRadius: '20px',
              padding: '10px 30px'
            }}
          >
            Submit
          </Button>
        ]}
        closable={false}
        maskClosable={false}
        width={600}
        style={{
          top: 50
        }}
      >
        <div style={{
          background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <p style={{ 
            fontSize: '16px', 
            color: '#333', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            To see personalized product and store recommendations, please select the categories you're interested in.
          </p>
          <MultiHierarchicalSelector
            onSelectionChange={handleInterestChange}
            selectedCategories={[]}
          />
          {selectedInterests.length > 0 && (
            <div style={{
              marginTop: '20px',
              padding: '10px',
              background: '#f0f0f0',
              borderRadius: '5px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: '#228B22', fontWeight: 'bold' }}>
                {selectedInterests.length} categor{selectedInterests.length === 1 ? 'y' : 'ies'} selected
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ForYou;

