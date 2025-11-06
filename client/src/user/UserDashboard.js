import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import UserSideBar from '../components/UserSideBar';
import { isAuthenticated } from '../actions/auth';
import { viewUser, getUserProducts } from '../actions/user';
import { closeProduct } from '../actions/product';
import { getBuyerOrders, getSellerOrders, updateOrderStatus } from '../actions/order';
import { Card, Empty, Pagination, message, Popconfirm, Button, Table, Tag, Modal, Input, DatePicker } from 'antd';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';

const { Meta } = Card;

const UserDashboard = () => {
  const { user, token } = isAuthenticated();
  const countPerPage = 5;
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [values, setValues] = useState({
    _id: '',
    followers: '',
    following: '',
    products: [],
    favourites: [],
    wallet: '',
    sellerCategories: [],
  });

  const styles = {
    container: {
      background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
      minHeight: '100vh',
      padding: '20px',
    },
    card: {
      backgroundColor: 'white',
      border: '1px solid #FFD700',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
    },
    button: {
      background: 'linear-gradient(to right, #32CD32, #228B22)',
      border: 'none',
      color: 'white',
      transition: 'all 0.3s ease',
    },
    text: {
      color: '#228B22',
    },
  };
  const [activeProducts, setActiveProducts] = useState([]);
  const [current, setCurrent] = useState();
  const [closed, setClosed] = useState(false);
  const [pagination, setPagination] = useState([]);
  const [positiveRatings, setpositiveRatings] = useState([]);
  const [negativeRatings, setnegativeRatings] = useState([]);
  const [filter, setFilter] = useState('active');
  const positiveRating = [];
  const negativeRating = [];

  // Orders state
  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryProvider, setDeliveryProvider] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(null);
  
  // Payment state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { selectedCurrency } = useSelector((state) => state.buynsellCurrency || { selectedCurrency: 'XLM' });

  const { _id, products, followers, following, favourites, wallet, sellerCategories } = values;

  const loadUser = async () => {
    let res = await viewUser(user._id);
    //get user ratings
    res.data.ratings.forEach((item) => {
      if (item.rating === 'positive') {
        positiveRating.push(item._id);
        setpositiveRatings(positiveRating);
      } else if (item.rating === 'negative') {
        negativeRating.push(item._id);
        setnegativeRatings(negativeRating);
      }
    });
    // console.log(res);
    setValues({
      _id: res.data._id,
      followers: res.data.followers,
      following: res.data.following,
      products: res.data.products,
      favourites: res.data.favourites,
      wallet: res.data.wallet || '',
      sellerCategories: res.data.sellerCategories || [],
    });
  };

  const loadUserProducts = async (page) => {
    let res = await getUserProducts(user._id, { filter: filter });
    setCurrent(page);
    const to = page * countPerPage;
    const from = to - countPerPage;
    setPagination(res.data.slice(from, to));
    setActiveProducts(res.data);
    console.log(res.data);
  };

  const loadOrders = async () => {
    try {
      const buyerRes = await getBuyerOrders(user._id, token);
      setOrders(buyerRes.data);

      const sellerRes = await getSellerOrders(user._id, token);
      setSellerOrders(sellerRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    // Check screen size
    const checkScreenSize = () => {
      const width = window.innerWidth;
      // Consider screens smaller than 768px (tablet breakpoint) as small screens
      setIsSmallScreen(width < 768);
    };

    // Check on mount
    checkScreenSize();

    // Check on resize
    window.addEventListener('resize', checkScreenSize);

    loadUser();
    loadUserProducts(1);
    loadOrders();

    // Socket.io for real-time updates
    const socket = io(process.env.REACT_APP_API.replace('/api', ''));
    socket.on('orderStatusChanged', (data) => {
      loadOrders(); // Reload orders when status changes
    });

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      socket.disconnect();
    };
  }, [filter, closed]);

  const handleClose = async (productId) => {
    try {
      const res = await closeProduct(productId);
      message.success('Product closed', 4);
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) message.error(err.response.data, 4);
    }
    setClosed(true);
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'COMPLETED');
      message.success('Order confirmed', 4);
      loadOrders();
    } catch (err) {
      console.log(err);
      message.error('Failed to confirm order', 4);
    }
  };

  const handlePayOrder = async (order) => {
    // ✅ SECURITY CHECK 1: Frontend validation
    if (order.buyerId !== user._id) {
      message.error('You can only pay for your own orders');
      return;
    }

    // ✅ SECURITY CHECK 2: Order status validation
    if (order.status !== 'AWAITING_PAYMENT') {
      message.error('This order cannot be paid');
      return;
    }

    // ✅ SECURITY CHECK 3: Auction order validation
    if (order.orderType === 'auction' && order.buyerId !== user._id) {
      message.error('Only the auction winner can pay for this order');
      return;
    }

    try {
      setPaymentOrder(order);
      setPaymentModalVisible(true);
      setPaymentStatus('loading');

      const res = await fetch(`${process.env.REACT_APP_API}/payment/stellar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: order.productId?._id || order.productId,
          buyerId: user._id,
          sellerId: order.sellerId?._id || order.sellerId,
          quantity: order.quantity || 1,
          currency: selectedCurrency
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setPaymentDetails(data);
        setPaymentStatus('ready');
        // Start polling for payment status
        pollPaymentStatus(data.orderId);
      } else {
        message.error(data.error || 'Failed to initiate payment');
        setPaymentStatus('error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      message.error('Failed to initiate payment');
      setPaymentStatus('error');
    }
  };

  const pollPaymentStatus = (orderId) => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API}/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.status === 'PAID' || data.order?.status === 'PAID') {
          setPaymentStatus('paid');
          message.success('Payment confirmed!');
          clearInterval(poll);
          setPaymentModalVisible(false);
          loadOrders(); // Reload orders
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 5000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(poll), 300000);
  };

  const handleMarkDelivering = async () => {
    try {
      await updateOrderStatus(selectedOrder._id, 'DELIVERING', trackingNumber, deliveryProvider, estimatedDeliveryDate);
      message.success('Order marked as delivering', 4);
      setIsModalVisible(false);
      setSelectedOrder(null);
      setTrackingNumber('');
      setDeliveryProvider('');
      setEstimatedDeliveryDate(null);
      loadOrders();
    } catch (err) {
      console.log(err);
      message.error('Failed to update order', 4);
    }
  };

  const showModal = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedOrder(null);
    setTrackingNumber('');
    setDeliveryProvider('');
    setEstimatedDeliveryDate(null);
  };

  // get Pending product count
  const pendingCount = products.filter(
    (product) => product.status === 'pending'
  );
  // get Active product count
  const activeCount = products.filter((product) => product.status === 'active');
  // get Closed product count
  const closedCount = products.filter((product) => product.status === 'closed');

  //format currency
  Number.prototype.format = function (n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
  };

  // Show message for sellers on small screens
  if (user && user.canSell && isSmallScreen) {
    return (
      <div
        className="container-fluid"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          className="card card-shadow"
          style={{
            maxWidth: '500px',
            width: '100%',
            borderRadius: '15px',
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
          }}
        >
          <div
            className="card-body text-center p-5"
            style={{
              background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
              borderRadius: '15px',
            }}
          >
            <div style={{ marginBottom: '30px' }}>
              <i
                className="fas fa-laptop fa-4x"
                style={{ color: '#228B22', marginBottom: '20px' }}
              ></i>
            </div>
            <h2 style={{ color: '#228B22', marginBottom: '20px', fontWeight: 'bold' }}>
              <i className="fas fa-store me-2"></i>
              Seller Dashboard
            </h2>
            <p
              style={{
                fontSize: '18px',
                color: '#333',
                marginBottom: '30px',
                lineHeight: '1.6',
              }}
            >
              The Seller Dashboard is optimized for larger screens to provide the best
              experience.
            </p>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '30px',
              }}
            >
              <h5 style={{ color: '#228B22', marginBottom: '15px' }}>
                <i className="fas fa-info-circle me-2"></i>
                Please use a larger device:
              </h5>
              <ul
                style={{
                  textAlign: 'left',
                  color: '#666',
                  fontSize: '16px',
                  listStyle: 'none',
                  padding: 0,
                }}
              >
                <li style={{ marginBottom: '10px' }}>
                  <i className="fas fa-check-circle me-2" style={{ color: '#228B22' }}></i>
                  Laptop or Desktop Computer
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <i className="fas fa-check-circle me-2" style={{ color: '#228B22' }}></i>
                  Tablet (iPad, Android Tablet)
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <i className="fas fa-times-circle me-2" style={{ color: '#dc3545' }}></i>
                  Mobile Phone (Not Supported)
                </li>
              </ul>
            </div>
            <p style={{ fontSize: '14px', color: '#999', fontStyle: 'italic' }}>
              Minimum screen width: 768px
            </p>
            <div style={{ marginTop: '30px' }}>
              <Link
                to="/"
                className="btn"
                style={{
                  background: 'linear-gradient(to right, #33b27b, #28a745)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '20px',
                  padding: '10px 30px',
                  fontSize: '16px',
                }}
              >
                <i className="fas fa-home me-2"></i>
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='row container-fluid mx-auto mt-5 profile-container' style={styles.container}>
        <UserSideBar
          _id={_id}
          products={products}
          followers={followers}
          following={following}
          favourites={favourites}
          positiveRatings={positiveRatings}
          negativeRatings={negativeRatings}
          wallet={wallet}
          sellerCategories={sellerCategories}
        />
        <div className='col-md-9 mb-5'>
          {/* Become Seller Section - Only show for non-sellers */}
          {!user.canSell && (
            <div className='card rounded-0 profile-card card-shadow mb-4' style={styles.card}>
              <div className='card-header profile-card p-3' style={{...styles.card, borderBottom: '1px solid #FFD700'}}>
                <h4 style={styles.text}>Become a Seller</h4>
              </div>
              <div className='card-body'>
                <p style={styles.text}>
                  Want to start selling on our platform? Complete your business profile to get started!
                </p>
                <Link to={`/user/become-seller/${user._id}`} className='btn' style={styles.button}>
                  <i className='fas fa-store me-2'></i> Become a Seller
                </Link>
              </div>
            </div>
          )}

          {/* Business Information Section - Only show for sellers */}
          {user.canSell && user.businessName && (
            <div className='card rounded-0 profile-card card-shadow mb-4' style={styles.card}>
              <div className='card-header profile-card p-3' style={{...styles.card, borderBottom: '1px solid #FFD700', background: 'linear-gradient(to right, #FFD700, #FFFFFF)'}}>
                <div className='d-flex align-items-center'>
                  {user.businessLogo && (
                    <img 
                      src={user.businessLogo} 
                      alt='Business Logo' 
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '8px', 
                        marginRight: '15px',
                        objectFit: 'cover',
                        border: '2px solid #228B22'
                      }} 
                    />
                  )}
                  <div>
                    <h4 style={styles.text}>
                      <i className='fas fa-store me-2'></i>
                      {user.businessName}
                    </h4>
                    {user.businessPhone && (
                      <small style={{ color: '#666' }}>
                        <i className='fas fa-phone me-1'></i>
                        {user.businessPhone}
                      </small>
                    )}
                  </div>
                </div>
              </div>
              <div className='card-body'>
                <div className='row'>
                  {user.socialMediaLinks && Object.keys(user.socialMediaLinks).length > 0 && (
                    <div className='col-md-6 mb-3'>
                      <h6 style={styles.text}>
                        <i className='fas fa-share-alt me-2'></i>Social Media
                      </h6>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {user.socialMediaLinks.facebook && (
                          <a 
                            href={user.socialMediaLinks.facebook} 
                            target='_blank' 
                            rel='noopener noreferrer' 
                            style={{ fontSize: '20px', color: '#1877F2' }}
                            title='Facebook'
                          >
                            <i className='fab fa-facebook'></i>
                          </a>
                        )}
                        {user.socialMediaLinks.instagram && (
                          <a 
                            href={user.socialMediaLinks.instagram} 
                            target='_blank' 
                            rel='noopener noreferrer' 
                            style={{ fontSize: '20px', color: '#E4405F' }}
                            title='Instagram'
                          >
                            <i className='fab fa-instagram'></i>
                          </a>
                        )}
                        {user.socialMediaLinks.twitter && (
                          <a 
                            href={user.socialMediaLinks.twitter} 
                            target='_blank' 
                            rel='noopener noreferrer' 
                            style={{ fontSize: '20px', color: '#1DA1F2' }}
                            title='Twitter'
                          >
                            <i className='fab fa-twitter'></i>
                          </a>
                        )}
                        {user.socialMediaLinks.linkedin && (
                          <a 
                            href={user.socialMediaLinks.linkedin} 
                            target='_blank' 
                            rel='noopener noreferrer' 
                            style={{ fontSize: '20px', color: '#0077B5' }}
                            title='LinkedIn'
                          >
                            <i className='fab fa-linkedin'></i>
                          </a>
                        )}
                        {user.socialMediaLinks.website && (
                          <a 
                            href={user.socialMediaLinks.website} 
                            target='_blank' 
                            rel='noopener noreferrer' 
                            style={{ fontSize: '20px', color: '#333' }}
                            title='Website'
                          >
                            <i className='fas fa-globe'></i>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {sellerCategories && sellerCategories.length > 0 && (
                    <div className='col-md-6 mb-3'>
                      <h6 style={styles.text}>
                        <i className='fas fa-tags me-2'></i>Business Categories ({sellerCategories.length})
                      </h6>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {sellerCategories.slice(0, 8).map((cat, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              fontSize: '11px', 
                              padding: '4px 8px', 
                              background: '#FFD700', 
                              color: '#228B22', 
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}
                          >
                            {cat.name || cat}
                          </span>
                        ))}
                        {sellerCategories.length > 8 && (
                          <span style={{ fontSize: '11px', color: '#666', padding: '4px 8px' }}>
                            +{sellerCategories.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className='mt-3 text-center'>
                  <Link 
                    to='/seller/connections' 
                    className='btn' 
                    style={{
                      ...styles.button,
                      borderRadius: '20px',
                      padding: '8px 20px',
                      fontSize: '14px'
                    }}
                  >
                    <i className='fas fa-users me-2'></i>
                    Manage Connections
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Section - Only show for sellers */}
          {user.canSell && !wallet && (
            <div className='card rounded-0 profile-card card-shadow mb-4' style={styles.card}>
              <div className='card-header profile-card p-3' style={{...styles.card, borderBottom: '1px solid #FFD700'}}>
                <h4 style={styles.text}>Wallet Setup</h4>
              </div>
              <div className='card-body'>
                <p style={styles.text}>You haven't set up your wallet yet. Please add your wallet address to receive payments.</p>
                <Link to={`/user/edit/${user._id}`} className='btn' style={styles.button}>
                  Add Wallet Address
                </Link>
              </div>
            </div>
          )}

          {/* Buyer Orders Section */}
          <div className='card rounded-0 profile-card card-shadow mb-4' style={styles.card}>
            <div className='card-header profile-card p-3' style={{...styles.card, borderBottom: '1px solid #FFD700'}}>
              <h4 style={styles.text}>My Orders (Buyer)</h4>
            </div>
            <div className='card-body'>
              {orders.length === 0 ? (
                <Empty description="No orders yet" />
              ) : (
                <Table
                  dataSource={orders}
                  columns={[
                    {
                      title: 'Product',
                      dataIndex: 'productName',
                      key: 'productName',
                    },
                    {
                      title: 'Seller',
                      dataIndex: 'sellerName',
                      key: 'sellerName',
                    },
                    {
                      title: 'Amount',
                      dataIndex: 'price',
                      key: 'price',
                      render: (price, record) => `USDC${price?.format()}${record.quantity > 1 ? ` (${record.quantity}x)` : ''}`,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => (
                        <Tag color={
                          status === 'COMPLETED' ? 'green' :
                          status === 'DELIVERING' ? 'blue' :
                          status === 'PENDING' ? 'orange' : 'red'
                        }>
                          {status}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => (
                        <div>
                          {record.status === 'AWAITING_PAYMENT' && (
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handlePayOrder(record)}
                              style={styles.button}
                            >
                              {record.orderType === 'auction' ? 'Pay Now (Auction)' : 'Pay Now'}
                            </Button>
                          )}
                          {record.status === 'DELIVERING' && (
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleConfirmOrder(record._id)}
                              style={styles.button}
                            >
                              Confirm Delivery
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]}
                  pagination={false}
                />
              )}
            </div>
          </div>

          {/* Seller Orders Section - Only show for sellers */}
          {user.canSell && (
            <div className='card rounded-0 profile-card card-shadow mb-4' style={styles.card}>
              <div className='card-header profile-card p-3' style={{...styles.card, borderBottom: '1px solid #FFD700'}}>
                <h4 style={styles.text}>Incoming Orders (Seller)</h4>
              </div>
            <div className='card-body'>
              {sellerOrders.length === 0 ? (
                <Empty description="No incoming orders" />
              ) : (
                <Table
                  dataSource={sellerOrders}
                  columns={[
                    {
                      title: 'Product',
                      dataIndex: 'productName',
                      key: 'productName',
                      render: (productName, record) => `${productName}${record.quantity > 1 ? ` (${record.quantity}x)` : ''}`,
                    },
                    {
                      title: 'Buyer',
                      dataIndex: 'buyerName',
                      key: 'buyerName',
                    },
                    {
                      title: 'Amount',
                      dataIndex: 'price',
                      key: 'price',
                      render: (price, record) => `USDC${price?.format()}${record.quantity > 1 ? ` (${record.quantity}x)` : ''}`,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => (
                        <Tag color={
                          status === 'PAID' ? 'green' :
                          status === 'COMPLETED' ? 'blue' :
                          status === 'DELIVERING' ? 'orange' :
                          status === 'PENDING' ? 'yellow' : 'red'
                        }>
                          {status}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Payout',
                      dataIndex: 'sellerPayout',
                      key: 'sellerPayout',
                      render: (payout) => payout ? `$${payout}` : 'Pending',
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => (
                        <div>
                          {record.status === 'PENDING' && (
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => showModal(record)}
                              style={styles.button}
                            >
                              Mark as Delivering
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]}
                  pagination={false}
                />
              )}
            </div>
          </div>
          )}

          {/* Products Section - Only show for sellers */}
          {user.canSell && (
            <div className='card rounded-0 profile-card card-shadow' style={styles.card}>
            <div className='d-flex justify-content-between card-header profile-card p-3' style={{...styles.card, borderBottom: '1px solid #FFD700'}}>
              {filter === 'active' && <h2 style={styles.text}>Active Products</h2>}
              {filter === 'pending' && <h2 style={styles.text}>Pending Products</h2>}
              {filter === 'closed' && <h2 style={styles.text}>Closed Products</h2>}
              <ul className='nav nav-pills justify-content-end'>
                <li
                  className={`nav-item nav-active-hover ${
                    filter === 'active' && 'nav-active'
                  }`}
                >
                  <a
                    onClick={() => setFilter('active')}
                    className={`nav-link nav-tab nav-tab-item nav-active nav-margin ${
                      filter === 'active' && 'active'
                    }`}
                    style={{...styles.button, border: 'none', color: 'white'}}
                  >
                    <small>
                      <i class='fas fa-check-circle'></i> Active (
                      {activeCount.length})
                    </small>
                  </a>
                </li>
                <li
                  className={`nav-item nav-pending-hover ${
                    filter === 'pending' && 'nav-pending'
                  }`}
                >
                  <a
                    onClick={() => setFilter('pending')}
                    className={`nav-link nav-tab nav-pending nav-tab-item nav-margin ${
                      filter === 'pending' && 'active'
                    }`}
                    style={{...styles.button, border: 'none', color: 'white'}}
                  >
                    <small>
                      {' '}
                      <i class='fas fa-clock'></i> Pending (
                      {pendingCount.length})
                    </small>
                  </a>
                </li>
                <li
                  className={`nav-item nav-closed-hover ${
                    filter === 'closed' && 'nav-closed'
                  }`}
                >
                  <a
                    onClick={() => setFilter('closed')}
                    className={`nav-link nav-tab nav-closed nav-tab-item nav-margin ${
                      filter === 'closed' && 'active'
                    }`}
                    style={{...styles.button, border: 'none', color: 'white'}}
                  >
                    <small>
                      <i class='fas fa-times-circle'></i> Closed (
                      {closedCount.length})
                    </small>
                  </a>
                </li>
              </ul>
            </div>
            <div>
              {activeProducts.length === 0 && (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
              {activeProducts.length > 0 && (
                <div className='card-body desktop-product-view' style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                  {pagination.map((p, i) => {
                    return (
                      <div class='card rounded-0 mb-3 product-card' key={i} style={{...styles.card, transition: 'transform 0.3s ease, box-shadow 0.3s ease'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                        <div class='row g-0'>
                          <div class='col-md-3 product-img'>
                            <Link
                              to={`/product/${p._id}`}
                              className='text-decoration-none'
                            >
                              <img
                                src={p.images[0]}
                                className='img-fluid rounded-start img-horizontal'
                                alt={p.name}
                                style={{ height: '100%' }}
                              />
                              <span className='product-img-count'>
                                <span className='badge badge-pill opacity'>
                                  {p.images.length}
                                  <i class='fas fa-images ps-1'></i>
                                </span>
                              </span>
                            </Link>
                          </div>
                          <div class='col-md-9'>
                            <div class='card-body pt-3 pb-2'>
                              <div className='d-flex justify-content-between'>
                                <Link
                                  to={`/product/${p._id}`}
                                  className='text-decoration-none'
                                >
                                  <h6 class='card-title text-dark1'>
                                    {p.name}
                                  </h6>
                                </Link>
                                <span>
                                  <h6 style={styles.text}>
                                    USDC{parseInt(p.price).format()}
                                  </h6>
                                </span>
                              </div>
                              <small>
                                <p class='card-text text-muted'>
                                  {p.description.substring(0, 110)}..
                                </p>
                              </small>
                              <div className='d-flex justify-content-between mt-4 product-cat-text'>
                                <div>
                                  <span>
                                    <Link
                                      to={`/category/${p.category._id}`}
                                      className='badge badge-pill text-muted me-2 text-decoration-none'
                                      style={{
                                        backgroundColor: '#FFD700',
                                        color: '#228B22',
                                        // fontSize: '14px',
                                      }}
                                    >
                                      {p.category.name}
                                    </Link>
                                  </span>
                                  <span>
                                    <div
                                      className='badge badge-pill text-muted'
                                      style={{
                                        backgroundColor: '#FFD700',
                                        color: '#228B22',
                                      }}
                                    >
                                      {p.condition}
                                    </div>
                                  </span>
                                </div>

                                <div>
                                  {user._id === _id && (
                                    <>
                                      <span className=''>
                                        <Link
                                          to={`/edit-product/${p._id}`}
                                          class='btn btn-sm text-white pt-0 pb-0 shadow-none'
                                          style={styles.button}
                                        >
                                          Edit
                                        </Link>
                                      </span>
                                      {p.status !== 'closed' && (
                                        <Popconfirm
                                          placement='top'
                                          title={'Are you sure to close?'}
                                          onConfirm={() => handleClose(p._id)}
                                          okText='Yes'
                                          cancelText='No'
                                        >
                                          <span className='ps-2'>
                                            <button class='btn btn-danger btn-sm text-white pt-0 pb-0 shadow-none'>
                                              Close
                                            </button>
                                          </span>
                                        </Popconfirm>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              <span class='card-text d-flex justify-content-between'>
                                <Link
                                  to={`/search-result?location=${p.location._id}&category=&name=&price=&condition=`}
                                  className='text-decoration-none'
                                >
                                  <p
                                    className='text-muted'
                                    style={{ fontSize: '14px' }}
                                  >
                                    <i class='fas fa-map-marker-alt me-2'></i>
                                    {p.location.name}
                                  </p>
                                </Link>
                                <small class='text-muted'>
                                  {moment(p.createdAt).fromNow()}
                                  {/* by{' '}
                                  <Link
                                    to={`/user/${p.author._id}`}
                                    className='text-decoration-none text-dark1'
                                  >
                                    {p.author.name}
                                  </Link> */}
                                </small>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Pagination
                    pageSize={countPerPage}
                    onChange={loadUserProducts}
                    defaultCurrent={current}
                    total={activeProducts.length}
                  />
                </div>
              )}

              {activeProducts.length > 0 && (
                <div className='card-body mobile-product' style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                  {pagination.map((p, i) => {
                    if (p.status === 'active') {
                      return (
                        <div
                          className='card card-shadow rounded-0 mb-3 mobile-product-view d-flex flex-row'
                          style={{ height: '12.43rem', ...styles.card, transition: 'transform 0.3s ease, box-shadow 0.3s ease'}}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <div className='product-img-mobile'>
                            <div className='product-img-mobile'>
                              <Link
                                to={`/product/${p._id}`}
                                className='text-decoration-none'
                              >
                                <img
                                  src={p.images[0]}
                                  className='card-img-top img-top-category'
                                  alt={p.name}
                                  style={{
                                    borderBottom: '1px solid rgba(0,0,0,.125)',
                                  }}
                                />
                                <span className='product-img-count'>
                                  <span className='badge badge-pill opacity'>
                                    {p.images.length}
                                    <i class='fas fa-images ps-1'></i>
                                  </span>
                                </span>
                              </Link>
                            </div>
                          </div>
                          <div class='card-body pt-3 pb-2'>
                            <div>
                              <Link
                                to={`/product/${p._id}`}
                                className='text-decoration-none'
                              >
                                <h6 class='card-title card-title-cat text-dark1'>
                                  {p.name.length > 40
                                    ? p.name.substring(0, 40) + '..'
                                    : p.name}
                                </h6>
                              </Link>
                              <span>
                                <h6 style={styles.text}>
                                  USDC{parseInt(p.price).format()}
                                </h6>
                              </span>
                            </div>
                            {/* <small>
                            <p class='card-text mobile-card-desc text-muted'>
                              {p.description.substring(0, 30)}..
                            </p>
                          </small> */}
                            <div className='mt-2 mb-2'>
                              <div>
                                <span>
                                  <Link
                                    to={`/category/${p.category._id}`}
                                    className='badge badge-pill text-muted me-2 text-decoration-none'
                                    style={{
                                      backgroundColor: '#FFD700',
                                      color: '#228B22',
                                    }}
                                  >
                                    {p.category.name}
                                  </Link>
                                </span>
                                <span>
                                  <div
                                    className='badge badge-pill text-muted'
                                    style={{
                                      backgroundColor: '#FFD700',
                                      color: '#228B22',
                                    }}
                                  >
                                    {p.condition}
                                  </div>
                                </span>
                              </div>
                            </div>
                            <div className='mb-3'>
                              {user._id === _id && (
                                <>
                                  <span className=''>
                                    <Link
                                      to={`/edit-product/${p._id}`}
                                      class='btn btn-sm text-white pt-0 pb-0 shadow-none'
                                      style={styles.button}
                                    >
                                      Edit
                                    </Link>
                                  </span>
                                  {p.status !== 'closed' && (
                                    <Popconfirm
                                      placement='top'
                                      title={'Are you sure to close?'}
                                      onConfirm={() => handleClose(p._id)}
                                      okText='Yes'
                                      cancelText='No'
                                    >
                                      <span className='ps-2'>
                                        <button class='btn btn-danger btn-sm text-white pt-0 pb-0 shadow-none'>
                                          Close
                                        </button>
                                      </span>
                                    </Popconfirm>
                                  )}
                                </>
                              )}
                            </div>
                            {/* <div className='mb-3'>
                              <small class='text-muted'>
                                By:{' '}
                                <Link
                                  to={`/user/${p.author._id}`}
                                  className='text-decoration-none text-dark1'
                                >
                                  {p.author.username}
                                </Link>
                              </small>
                            </div> */}
                            <div class='card-text d-flex justify-content-between align-items-center mt-1'>
                              <div>
                                <Link
                                  to={`/search-result?location=${p.location._id}&category=&name=&price=&condition=`}
                                  className='text-decoration-none mt-auto'
                                >
                                  <p
                                    className='text-muted'
                                    style={{ fontSize: '0.85rem' }}
                                  >
                                    <i class='fas fa-map-marker-alt me-2'></i>
                                    {p.location.name}
                                  </p>
                                </Link>
                              </div>
                              <small
                                class='text-muted'
                                style={{ fontSize: '0.85rem' }}
                              >
                                {moment(p.createdAt).fromNow()}
                              </small>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                  <Pagination
                    pageSize={countPerPage}
                    onChange={loadUserProducts}
                    defaultCurrent={current}
                    total={activeProducts.length}
                  />
                </div>
              )}
            </div>
          </div>
          )}

          {/* Modal for marking as delivering */}
          <Modal
            title="Mark Order as Delivering"
            visible={isModalVisible}
            onOk={handleMarkDelivering}
            onCancel={handleCancel}
          >
            <div className="mb-3">
              <label>Tracking Number</label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            <div className="mb-3">
              <label>Delivery Provider</label>
              <Input
                value={deliveryProvider}
                onChange={(e) => setDeliveryProvider(e.target.value)}
                placeholder="Enter delivery provider"
              />
            </div>
            <div className="mb-3">
              <label>Estimated Delivery Date</label>
              <DatePicker
                value={estimatedDeliveryDate}
                onChange={(date) => setEstimatedDeliveryDate(date)}
                style={{ width: '100%' }}
              />
            </div>
          </Modal>

          {/* Payment Modal */}
          <Modal
            title={paymentOrder?.orderType === 'auction' ? 'Pay for Auction Order' : 'Complete Payment'}
            open={paymentModalVisible}
            onCancel={() => {
              setPaymentModalVisible(false);
              setPaymentOrder(null);
              setPaymentDetails(null);
              setPaymentStatus(null);
            }}
            footer={null}
            width={720}
          >
            {paymentStatus === 'loading' && (
              <div className="text-center p-5">
                <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#FFD700' }}></i>
                <p style={{ marginTop: '15px', color: '#666' }}>Preparing payment...</p>
              </div>
            )}

            {paymentStatus === 'error' && (
              <div className="text-center p-5">
                <i className="fas fa-exclamation-circle fa-3x" style={{ color: '#dc3545' }}></i>
                <p style={{ marginTop: '15px', color: '#666' }}>Failed to initiate payment. Please try again.</p>
              </div>
            )}

            {paymentStatus === 'ready' && paymentDetails && (
              <div>
                {paymentOrder?.orderType === 'auction' && (
                  <div className="alert alert-info mb-3">
                    <i className="fas fa-trophy me-2"></i>
                    <strong>Congratulations!</strong> You won this auction. Please complete payment to receive your item.
                  </div>
                )}
                <div className="mb-3">
                  <strong>Order ID:</strong> {paymentDetails.orderId || paymentOrder?._id}
                </div>
                <div className="mb-3">
                  <strong>Amount:</strong> {paymentDetails.amount || paymentOrder?.displayPrice} {paymentDetails.currency || paymentOrder?.displayCurrency || 'XLM'}
                </div>
                {paymentDetails.address && (
                  <div className="mb-3">
                    <div className="mb-2"><strong>Send {paymentDetails.amount || paymentOrder?.displayPrice} {paymentDetails.currency || paymentOrder?.displayCurrency || 'XLM'} to:</strong></div>
                    <div style={{ wordBreak: 'break-all', background: '#f5f5f5', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                      {paymentDetails.address}
                    </div>
                    <div className="d-flex gap-2">
                      <Button size="small" onClick={() => navigator.clipboard.writeText(paymentDetails.address)}>
                        Copy Address
                      </Button>
                      <Button size="small" onClick={() => navigator.clipboard.writeText(paymentDetails.amount || paymentOrder?.displayPrice)}>
                        Copy Amount
                      </Button>
                    </div>
                  </div>
                )}
                {paymentDetails.memo && (
                  <div className="mb-3">
                    <div className="mb-2"><strong>Memo:</strong></div>
                    <div style={{ wordBreak: 'break-all', background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                      {paymentDetails.memo}
                    </div>
                  </div>
                )}
                {paymentDetails.sep7 && (
                  <div className="mb-3">
                    <a href={paymentDetails.sep7} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      <i className="fas fa-wallet me-2"></i>
                      Open in Stellar Wallet
                    </a>
                  </div>
                )}
                <div className="mt-3 text-muted" style={{ fontSize: '12px' }}>
                  After sending, the payment status will update automatically. This may take a few minutes.
                </div>
              </div>
            )}

            {paymentStatus === 'paid' && (
              <div className="text-center p-5">
                <i className="fas fa-check-circle fa-3x" style={{ color: '#28a745' }}></i>
                <p style={{ marginTop: '15px', color: '#666' }}>Payment confirmed! Your order is being processed.</p>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;
