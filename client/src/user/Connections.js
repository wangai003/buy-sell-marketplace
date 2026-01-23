import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { isAuthenticated } from '../actions/auth';
import {
  getPotentialConnections,
  getConnectedBuyers,
  createConnection,
  getConnectionsSubscriptionStatus,
} from '../actions/user';
import {
  Tabs,
  Card,
  Avatar,
  Empty,
  Button,
  Tag,
  message,
  Pagination,
  Space,
  Alert,
} from 'antd';
import {
  UserAddOutlined,
  MessageOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import SimplePaymentModal from '../components/SimplePaymentModal';
import SubscriptionTierModal from '../components/SubscriptionTierModal';

const Connections = () => {
  const { user, token } = isAuthenticated();
  const history = useHistory();
  const [potentialBuyers, setPotentialBuyers] = useState([]);
  const [connectedBuyers, setConnectedBuyers] = useState([]);
  const [loadingPotential, setLoadingPotential] = useState(false);
  const [loadingConnected, setLoadingConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('potential');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentConnectedPage, setCurrentConnectedPage] = useState(1);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isActive: false,
    activeUntil: null,
    tier: 'FREE',
    billingCycle: 'monthly',
    tierConfig: {},
    usage: {},
  });
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [subscriptionPaymentVisible, setSubscriptionPaymentVisible] = useState(false);
  const [subscriptionPaymentDetails, setSubscriptionPaymentDetails] = useState(null);
  const [tierSelectionVisible, setTierSelectionVisible] = useState(false);
  const countPerPage = 12;
  
  // Refs to prevent duplicate calls and error flooding
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const errorShownRef = useRef(false);
  const errorTimeoutRef = useRef(null);
  
  // Helper to show error only once per period
  const showErrorOnce = (errorMessage, duration = 5000) => {
    if (!errorShownRef.current) {
      errorShownRef.current = true;
      message.error(errorMessage);
      // Reset error flag after duration
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        errorShownRef.current = false;
      }, duration);
    }
  };

  const loadSubscriptionStatus = useCallback(async () => {
    if (!user || !token) return;
    try {
      const res = await getConnectionsSubscriptionStatus(user._id, token);
      setSubscriptionStatus(res.data);
      setSubscriptionRequired(!res.data?.isActive);
    } catch (err) {
      console.error('Error loading subscription status:', err);
      // Don't show error - just log it
    }
  }, [user?._id, token]);

  const loadPotentialConnections = useCallback(async () => {
    if (!user || !token || isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoadingPotential(true);
    try {
      const res = await getPotentialConnections(user._id, token);
      setPotentialBuyers(res.data || []);
      setSubscriptionRequired(false);
      errorShownRef.current = false; // Reset error flag on success
    } catch (err) {
      if (err?.response?.status === 402) {
        setSubscriptionRequired(true);
        setPotentialBuyers([]);
        setSubscriptionStatus((prev) => ({
          ...prev,
          activeUntil: err.response?.data?.activeUntil || null,
          isActive: false,
        }));
        errorShownRef.current = false; // Don't count 402 as an error
      } else {
        console.error('Error loading potential connections:', err);
        // Only show error once
        showErrorOnce('Failed to load potential connections');
      }
    } finally {
      setLoadingPotential(false);
      isLoadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, token]); // showErrorOnce is stable, user._id is sufficient

  const loadConnectedBuyers = useCallback(async () => {
    if (!user || !token) return;
    setLoadingConnected(true);
    try {
      const res = await getConnectedBuyers(user._id, token);
      setConnectedBuyers(res.data || []);
    } catch (err) {
      console.error('Error loading connected buyers:', err);
      // Only show error once
      showErrorOnce('Failed to load connected buyers');
    } finally {
      setLoadingConnected(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, token]); // showErrorOnce is stable, user._id is sufficient

  useEffect(() => {
    if (!user || !token) {
      message.warning('Please login to access connections');
      history.push('/login');
      return;
    }

    if (!user.canSell) {
      message.error('Only sellers can access connections');
      history.push('/user/dashboard');
      return;
    }

    // Only load once when component mounts or user._id changes
    const userId = user?._id;
    if (userId && (!hasLoadedRef.current || hasLoadedRef.current !== userId)) {
      hasLoadedRef.current = userId;
      errorShownRef.current = false;
      isLoadingRef.current = false;
      loadSubscriptionStatus();
      loadPotentialConnections();
      loadConnectedBuyers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, token]); // Only depend on user._id and token, not the functions

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const handleConnect = async (buyerId) => {
    try {
      await createConnection(user._id, buyerId, token);
      message.success('Connection created successfully!');
      // Reload both lists
      errorShownRef.current = false; // Reset error flag
      loadPotentialConnections();
      loadConnectedBuyers();
    } catch (err) {
      if (err?.response?.status === 402) {
        setSubscriptionRequired(true);
        message.warning('Subscription required to connect with buyers.');
        loadSubscriptionStatus();
      } else {
        console.error('Error creating connection:', err);
        // Only show error once
        showErrorOnce('Failed to create connection. Please try again.');
      }
    }
  };

  const handleStartSubscription = () => {
    setTierSelectionVisible(true);
  };

  const handleTierSelected = async (tier, billingCycle, tierConfig) => {
    setTierSelectionVisible(false);
    if (!user || !token) return;
    
    try {
      setSubscriptionPaymentVisible(true);
      const selectedCurrency = localStorage.getItem('selectedCurrency') || 'USDC';
      const res = await fetch(`${process.env.REACT_APP_API}/payment/subscription/external-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sellerId: user._id,
          tier,
          billingCycle,
          currency: selectedCurrency,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscriptionPaymentDetails(data);
      } else {
        // Only show error once
        showErrorOnce(data.error || 'Failed to initiate subscription payment');
        setSubscriptionPaymentVisible(false);
      }
    } catch (error) {
      console.error('Subscription payment error:', error);
      // Only show error once
      showErrorOnce('Failed to initiate subscription payment');
      setSubscriptionPaymentVisible(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSubscriptionPaymentVisible(false);
    setSubscriptionPaymentDetails(null);
    loadSubscriptionStatus();
    loadPotentialConnections();
    message.success('Subscription activated successfully!');
  };

  const handleOpenChat = (buyerId) => {
    history.push(`/messages?&message=${buyerId}`);
  };

  const handleViewProducts = () => {
    history.push('/add-product/' + user._id);
  };

  const getPaginationData = (data, page) => {
    const from = (page - 1) * countPerPage;
    const to = from + countPerPage;
    return data.slice(from, to);
  };

  if (!user || !user.canSell) {
    return null;
  }

  return (
    <div
      className="container-fluid mb-5"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
      }}
    >
      <div className="col-md-10 mx-auto mt-5">
        <div
          className="card rounded-0 profile-card card-shadow mb-4"
          style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            className="card-header p-4"
            style={{
              borderBottom: '2px solid #FFD700',
              background: 'linear-gradient(to right, #FFD700, #FFFFFF)',
            }}
          >
            <h2 style={{ color: '#228B22', margin: 0 }}>
              <i className="fas fa-users me-2"></i>Connections
            </h2>
            <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>
              Connect with buyers interested in your product categories
            </p>
          </div>

          <div className="card-body p-4">
            {subscriptionRequired && (
              <Alert
                type="warning"
                showIcon
                message="Subscription required"
                description={
                  subscriptionStatus.activeUntil
                    ? `Your access expired on ${new Date(subscriptionStatus.activeUntil).toLocaleDateString()}. Renew to view potential buyers.`
                    : 'Subscribe to view potential buyers that match your categories.'
                }
                action={
                  <Button type="primary" onClick={handleStartSubscription}>
                    Subscribe
                  </Button>
                }
                style={{ marginBottom: 16 }}
              />
            )}
            {subscriptionStatus.isActive && subscriptionStatus.usage && (
              <Alert
                type="info"
                showIcon
                message={
                  <Space>
                    <span>
                      {subscriptionStatus.tierConfig?.name || subscriptionStatus.tier} Plan
                      {subscriptionStatus.tierConfig?.badge && (
                        <Tag color="gold" style={{ marginLeft: 8 }}>
                          {subscriptionStatus.tierConfig.badge}
                        </Tag>
                      )}
                    </span>
                    {subscriptionStatus.usage.connectionsLimit !== -1 && (
                      <span>
                        Connections: {subscriptionStatus.usage.connectionsUsed || 0} / {subscriptionStatus.usage.connectionsLimit}
                      </span>
                    )}
                  </Space>
                }
                description={
                  subscriptionStatus.activeUntil
                    ? `Active until ${new Date(subscriptionStatus.activeUntil).toLocaleDateString()}`
                    : 'Active subscription'
                }
                action={
                  <Button onClick={handleStartSubscription}>
                    Upgrade/Change Plan
                  </Button>
                }
                style={{ marginBottom: 16 }}
              />
            )}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              size="large"
              items={[
                {
                  key: 'potential',
                  label: (
                    <span>
                      <UserAddOutlined />
                      Potential Connections ({potentialBuyers.length})
                    </span>
                  ),
                  children: (
                    <>
                      {loadingPotential ? (
                        <div className="text-center p-5">
                          <i
                            className="fas fa-spinner fa-spin fa-3x"
                            style={{ color: '#FFD700' }}
                          ></i>
                          <p style={{ marginTop: '15px', color: '#666' }}>
                            Loading potential connections...
                          </p>
                        </div>
                      ) : potentialBuyers.length === 0 ? (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <p>No potential connections found</p>
                              <p style={{ fontSize: '12px', color: '#999' }}>
                                Buyers with matching interests will appear here
                              </p>
                            </div>
                          }
                        />
                      ) : (
                        <>
                          <div className="row">
                            {getPaginationData(
                              potentialBuyers,
                              currentPage
                            ).map((buyer, i) => (
                              <div className="col-md-4 mb-4" key={i}>
                                <Card
                                  hoverable
                                  className="card-shadow"
                                  style={{
                                    borderRadius: '10px',
                                    transition: 'transform 0.3s ease',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform =
                                      'translateY(-5px)')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform =
                                      'translateY(0)')
                                  }
                                >
                                  <div className="text-center">
                                    <Avatar
                                      src={buyer.photo}
                                      size={80}
                                      style={{
                                        border: '2px solid #ddd',
                                        marginBottom: '15px',
                                      }}
                                    >
                                      {buyer.name[0]}
                                    </Avatar>
                                    <h5
                                      style={{
                                        color: '#228B22',
                                        fontWeight: 'bold',
                                        marginBottom: '5px',
                                      }}
                                    >
                                      {buyer.name}
                                    </h5>
                                    <small style={{ color: '#666' }}>
                                      @{buyer.username}
                                    </small>
                                    <div className="mt-3">
                                      <p style={{ margin: '5px 0', color: '#333' }}>
                                        <i
                                          className="fas fa-phone me-2"
                                          style={{ color: '#228B22' }}
                                        ></i>
                                        {buyer.phone}
                                      </p>
                                      {buyer.interestedCategories &&
                                        buyer.interestedCategories.length > 0 && (
                                          <div className="mt-2">
                                            <small
                                              style={{
                                                color: '#666',
                                                display: 'block',
                                                marginBottom: '5px',
                                              }}
                                            >
                                              Interested in ({buyer.interestedCategories.length}):
                                            </small>
                                            <div
                                              style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '5px',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              {buyer.interestedCategories
                                                .slice(0, 3)
                                                .map((cat, idx) => (
                                                  <Tag
                                                    key={idx}
                                                    color="blue"
                                                    style={{ fontSize: '10px' }}
                                                  >
                                                    {cat.name || cat}
                                                  </Tag>
                                                ))}
                                              {buyer.interestedCategories.length > 3 && (
                                                <Tag
                                                  color="default"
                                                  style={{ fontSize: '10px' }}
                                                >
                                                  +{buyer.interestedCategories.length - 3}
                                                </Tag>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                      <Button
                                        type="primary"
                                        icon={<UserAddOutlined />}
                                        onClick={() => handleConnect(buyer._id)}
                                        style={{
                                          background:
                                            'linear-gradient(to right, #33b27b, #28a745)',
                                          border: 'none',
                                          borderRadius: '20px',
                                          padding: '5px 20px',
                                        }}
                                      >
                                        Connect
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            ))}
                          </div>
                          {potentialBuyers.length > countPerPage && (
                            <div className="text-center mt-4">
                              <Pagination
                                current={currentPage}
                                total={potentialBuyers.length}
                                pageSize={countPerPage}
                                onChange={(page) => setCurrentPage(page)}
                                showSizeChanger={false}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ),
                },
                {
                  key: 'connected',
                  label: (
                    <span>
                      <UserOutlined />
                      Connected Buyers ({connectedBuyers.length})
                    </span>
                  ),
                  children: (
                    <>
                      {loadingConnected ? (
                        <div className="text-center p-5">
                          <i
                            className="fas fa-spinner fa-spin fa-3x"
                            style={{ color: '#FFD700' }}
                          ></i>
                          <p style={{ marginTop: '15px', color: '#666' }}>
                            Loading connected buyers...
                          </p>
                        </div>
                      ) : connectedBuyers.length === 0 ? (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <p>No connected buyers yet</p>
                              <p style={{ fontSize: '12px', color: '#999' }}>
                                Connect with buyers from the Potential Connections tab
                              </p>
                            </div>
                          }
                        />
                      ) : (
                        <>
                          <div className="row">
                            {getPaginationData(
                              connectedBuyers,
                              currentConnectedPage
                            ).map((buyer, i) => (
                              <div className="col-md-4 mb-4" key={i}>
                                <Card
                                  hoverable
                                  className="card-shadow"
                                  style={{
                                    borderRadius: '10px',
                                    transition: 'transform 0.3s ease',
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform =
                                      'translateY(-5px)')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform =
                                      'translateY(0)')
                                  }
                                >
                                  <div className="text-center">
                                    <Avatar
                                      src={buyer.photo}
                                      size={80}
                                      style={{
                                        border: '3px solid #FFD700',
                                        marginBottom: '15px',
                                      }}
                                    >
                                      {buyer.name[0]}
                                    </Avatar>
                                    <h5
                                      style={{
                                        color: '#228B22',
                                        fontWeight: 'bold',
                                        marginBottom: '5px',
                                      }}
                                    >
                                      {buyer.name}
                                    </h5>
                                    <small style={{ color: '#666' }}>
                                      @{buyer.username}
                                    </small>
                                    <div className="mt-3">
                                      <p style={{ margin: '5px 0', color: '#333' }}>
                                        <i
                                          className="fas fa-phone me-2"
                                          style={{ color: '#228B22' }}
                                        ></i>
                                        {buyer.phone}
                                      </p>
                                      {buyer.interestedCategories &&
                                        buyer.interestedCategories.length > 0 && (
                                          <div className="mt-2">
                                            <small
                                              style={{
                                                color: '#666',
                                                display: 'block',
                                                marginBottom: '5px',
                                              }}
                                            >
                                              Interested in ({buyer.interestedCategories.length}):
                                            </small>
                                            <div
                                              style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '5px',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              {buyer.interestedCategories
                                                .slice(0, 3)
                                                .map((cat, idx) => (
                                                  <Tag
                                                    key={idx}
                                                    color="gold"
                                                    style={{ fontSize: '10px' }}
                                                  >
                                                    {cat.name || cat}
                                                  </Tag>
                                                ))}
                                              {buyer.interestedCategories.length > 3 && (
                                                <Tag
                                                  color="default"
                                                  style={{ fontSize: '10px' }}
                                                >
                                                  +{buyer.interestedCategories.length - 3}
                                                </Tag>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                      <Space>
                                        <Button
                                          type="primary"
                                          icon={<MessageOutlined />}
                                          onClick={() => handleOpenChat(buyer._id)}
                                          style={{
                                            background:
                                              'linear-gradient(to right, #33b27b, #28a745)',
                                            border: 'none',
                                            borderRadius: '20px',
                                            padding: '5px 15px',
                                          }}
                                        >
                                          Chat
                                        </Button>
                                        <Button
                                          type="default"
                                          icon={<ShopOutlined />}
                                          onClick={handleViewProducts}
                                          style={{
                                            borderRadius: '20px',
                                            padding: '5px 15px',
                                          }}
                                        >
                                          Sell
                                        </Button>
                                      </Space>
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            ))}
                          </div>
                          {connectedBuyers.length > countPerPage && (
                            <div className="text-center mt-4">
                              <Pagination
                                current={currentConnectedPage}
                                total={connectedBuyers.length}
                                pageSize={countPerPage}
                                onChange={(page) =>
                                  setCurrentConnectedPage(page)
                                }
                                showSizeChanger={false}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ),
                },
              ]}
            />
            <SubscriptionTierModal
              visible={tierSelectionVisible}
              onCancel={() => setTierSelectionVisible(false)}
              onSelectTier={handleTierSelected}
              currentTier={subscriptionStatus.tier}
            />
            <SimplePaymentModal
              visible={subscriptionPaymentVisible}
              onCancel={() => setSubscriptionPaymentVisible(false)}
              paymentDetails={subscriptionPaymentDetails}
              orderType="subscription"
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connections;

