import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from 'react-router';
import { isAuthenticated } from '../actions/auth';
import moment from 'moment';
import { Card, Avatar, Empty, Pagination, message, Table, Button, Tag } from 'antd';
import { getReportedProducts } from '../actions/product';
import {
  productStatus,
  updateproductStatus,
  pendingProducts,
} from '../actions/admin';
import { getAllOrders, paySeller } from '../actions/order';
import ManageAdvertisements from './ManageAdvertisements';
import io from 'socket.io-client';

const { Meta } = Card;

const AdminDashboard = () => {
  const countPerPage = 5;
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState([]);
  const [orders, setOrders] = useState([]);
  const [enums, setEnums] = useState({
    status: [],
    newStatus: '',
  });
  const [current, setCurrent] = useState();
  const [pagination, setPagination] = useState();
  const { status, newStatus } = enums;
  const { user, token } = isAuthenticated();

  const loadProducts = async (page) => {
    const res = await pendingProducts();
    setCurrent(page);
    const to = page * countPerPage;
    const from = to - countPerPage;
    setPagination(res.data.slice(from, to));
    console.log(res.data);
    setProducts(res.data);
  };

  const loadProductStatus = async () => {
    const res = await productStatus();
    setEnums({ status: res.data });
  };

  const loadReports = async (page) => {
    const res = await getReportedProducts();
    setReports(res.data);
  };

  const loadOrders = async () => {
    try {
      const res = await getAllOrders();
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadProducts(1);
    loadProductStatus();
    loadReports();
    loadOrders();

    // Socket.io for real-time updates
    const socket = io(process.env.REACT_APP_API.replace('/api', ''));
    socket.on('orderStatusChanged', (data) => {
      loadOrders(); // Reload orders when status changes
    });

    return () => {
      socket.disconnect();
    };
  }, [newStatus]);

  // check for Pending products if none display Empty
  let checkPending = products.some(function (product) {
    return product.status === 'pending';
  });

  // get Pending product count
  const pendingCount = products.filter(
    (product) => product.status === 'pending'
  );

  const handleStatusChange = async (e, productId) => {
    const status = e.target.value;
    try {
      const res = await updateproductStatus({ productId, status, token });
      console.log(res);
      message.success('Status updated', 4);
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) message.error(err.response.data, 4);
    }
    setEnums({ ...enums, newStatus: status });
  };

  const handlePaySeller = async (orderId) => {
    try {
      await paySeller(orderId, token);
      message.success('Seller paid successfully', 4);
      loadOrders();
    } catch (err) {
      console.log(err);
      message.error('Failed to pay seller', 4);
    }
  };

  const formatNumber = (num, n = 0, x = 3) => {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return num.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
  };

  const history = useHistory();

  const logout = () => {
    window.localStorage.removeItem('buynsell');
    history.push('/login');
    window.location.reload();
  };

  return (
    <>
      <div className='row container-fluid mx-auto mt-5 profile-container'>
        <div className='col-md-3 mb-5'>
          <Card
            className='card-shadow'
            style={{ width: 'auto' }}
            cover={
              <Avatar
                src={user.photo}
                className='mx-auto mt-3 avatar-user'
                size={130}
              >
                {user.name[0]}
              </Avatar>
            }
          >
            <div className='text-center'>
              <h5>({user.username})</h5>
            </div>
            <Meta
              title={user.name}
              description={user.phone}
              className='text-center user-details'
            />
          </Card>
          <ul className='list-group rounded-0 profile-list card-shadow'>
            {user.role === 'admin' && (
              <li className='list-group-item'>
                <Link
                  to='/user/dashboard'
                  className='text-dark1 text-dark-hover text-decoration-none'
                >
                  <i class='fas fa-user'></i> User Dashboard
                </Link>
              </li>
            )}
            <li className='list-group-item'>
              <Link
                to='/admin/add-category'
                className='text-dark1 text-dark-hover text-decoration-none'
              >
                <i class='fas fa-plus-square'></i> Add Category
              </Link>
            </li>
            <li className='list-group-item'>
              <Link
                to='/admin/add-location'
                className='text-dark1 text-dark-hover text-decoration-none'
              >
                <i class='fas fa-plus-circle'></i> Add Location
              </Link>
            </li>
            <li className='list-group-item'>
              <Link
                to='/admin/users'
                className='text-dark1 text-dark-hover text-decoration-none'
              >
                <i class='fas fa-user-edit'></i> Manage Users
              </Link>
            </li>
            <li className='list-group-item'>
              <Link
                to='/admin/all-products'
                className='text-dark1 text-dark-hover text-decoration-none'
              >
                <i class='fas fa-list-alt'></i> Manage Products
              </Link>
            </li>
            <li className='list-group-item'>
              <Link
                to='/admin/advertisements'
                className='text-dark1 text-dark-hover text-decoration-none'
              >
                <i class='fas fa-ad'></i> Manage Advertisements
              </Link>
            </li>
            <Link
              to='/admin/reported-products'
              className='text-dark1 text-dark-hover text-decoration-none'
            >
              <li className='list-group-item text-dark-hover d-flex justify-content-between align-items-center text-dark1'>
                <i class='fas fa-flag me-1'></i>{' '}
                <span className='me-auto'>Reported Products</span>
                <span class='badge badge-pill bg-danger'>{reports.length}</span>
              </li>
            </Link>
            <li
              className='list-group-item text-dark1'
              role='button'
              onClick={logout}
            >
              <i class='fas fa-sign-out-alt'></i> Logout
            </li>
          </ul>
        </div>
        <div className='col-md-9 mb-5' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div className='card rounded-0 profile-card card-shadow' style={{ background: 'linear-gradient(to right, #FFD700, #FFFFFF)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
            <div className='card-header profile-card p-3' style={{ background: '#228B22', color: 'white', borderRadius: '8px 8px 0 0' }}>
              <h4>Products Awaiting Moderation ({pendingCount.length})</h4>
            </div>
            {!checkPending && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            {checkPending && (
              <div className='card-body' style={{ background: 'white', borderRadius: '0 0 8px 8px' }}>
                {pagination.map((p, i) => {
                  if (p.status === 'pending') {
                    return (
                      <div class='card rounded-0 mb-3 product-card' key={i} style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRadius: '8px', transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
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
                                style={{ height: '100%', borderRadius: '8px 0 0 8px' }}
                              />
                              <span className='product-img-count'>
                                <span className='badge badge-pill opacity' style={{ background: '#FFD700', color: '#228B22' }}>
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
                                  <h6 class='card-title text-dark1' style={{ color: '#228B22' }}>
                                    {p.name}
                                  </h6>
                                </Link>
                                <span>
                                  <h6 className='text-success'>
                                    USDC{formatNumber(parseInt(p.price))}
                                  </h6>
                                </span>
                              </div>
                              <small>
                                <p class='card-text text-muted'>
                                  {p.description.substring(0, 85)}..
                                </p>
                              </small>
                              <div className='d-flex justify-content-between align-items-center mt-4 product-cat-text'>
                                <div>
                                  <span>
                                    <Link
                                      to={`/category/${p.category._id}`}
                                      className='badge badge-pill text-muted me-2 text-decoration-none'
                                      style={{
                                        backgroundColor: '#FFD700',
                                        color: '#228B22',
                                        borderRadius: '4px',
                                        transition: 'background-color 0.3s ease'
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
                                        borderRadius: '4px'
                                      }}
                                    >
                                      {p.condition}
                                    </div>
                                  </span>
                                </div>
                                <div className='d-flex align-items-center'>
                                  <span className='ms-2'>
                                    <select
                                      class='form-select shadow-none'
                                      aria-label='Default select example'
                                      style={{
                                        padding: '.2rem 2.25rem .2rem .75rem',
                                        border: '1px solid #FFD700',
                                        borderRadius: '4px'
                                      }}
                                      onChange={(e) =>
                                        handleStatusChange(e, p._id)
                                      }
                                    >
                                      <option>{p.status}</option>
                                      {status.map((s, i) => (
                                        <option key={i} value={s} className='text-capitalize'>
                                          {s}
                                        </option>
                                      ))}
                                    </select>
                                  </span>
                                  <span className='ps-2'>
                                    <Link
                                      to={`/edit-product/${p._id}`}
                                      class='btn btn-primary btn-sm text-white pt-0 pb-0'
                                      style={{ background: '#228B22', border: 'none', borderRadius: '4px', transition: 'background-color 0.3s ease' }}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#FFD700'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = '#228B22'}
                                    >
                                      Edit
                                    </Link>
                                  </span>
                                </div>
                              </div>
                              <span class='card-text d-flex justify-content-between'>
                                <Link
                                  to={`/search-result?&location=${p.location._id}&category=&name=&price=&condition=`}
                                  className='text-decoration-none'
                                >
                                  <p className='text-muted'>
                                    <i class='fas fa-map-marker-alt me-2'></i>
                                    {p.location.name}
                                  </p>
                                </Link>
                                <small class='text-muted'>
                                  {moment(p.createdAt).fromNow()} by{' '}
                                  <Link
                                    to={`/user/${p.author._id}`}
                                    className='text-decoration-none text-dark1'
                                  >
                                    {p.author.name}
                                  </Link>
                                </small>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
                <Pagination
                  pageSize={countPerPage}
                  onChange={loadProducts}
                  defaultCurrent={current}
                  total={products.length}
                  style={{ marginTop: '20px', textAlign: 'center' }}
                />
              </div>
            )}
          </div>

          {/* Orders Management */}
          <div className='card rounded-0 profile-card card-shadow mt-4' style={{ background: 'linear-gradient(to right, #FFD700, #FFFFFF)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
            <div className='card-header profile-card p-3' style={{ background: '#228B22', color: 'white', borderRadius: '8px 8px 0 0' }}>
              <h4>All Orders</h4>
            </div>
            <div className='card-body' style={{ background: 'white', borderRadius: '0 0 8px 8px' }}>
              <Table
                dataSource={orders}
                columns={[
                  {
                    title: 'Product',
                    dataIndex: 'productName',
                    key: 'productName',
                  },
                  {
                    title: 'Buyer',
                    dataIndex: 'buyerName',
                    key: 'buyerName',
                  },
                  {
                    title: 'Seller',
                    dataIndex: 'sellerName',
                    key: 'sellerName',
                  },
                  {
                    title: 'Amount',
                    dataIndex: 'paidAmount',
                    key: 'paidAmount',
                    render: (amount) => amount ? `$${amount}` : 'N/A',
                  },
                  {
                    title: 'Completed',
                    dataIndex: 'completedAt',
                    key: 'completedAt',
                    render: (date) => date ? moment(date).format('MMM DD, YYYY') : 'No',
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
                    title: 'Pay',
                    key: 'pay',
                    render: (_, record) => (
                      record.status === 'PENDING_PAY' ? (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handlePaySeller(record._id)}
                          style={{ background: '#228B22', border: 'none', borderRadius: '4px', transition: 'background-color 0.3s ease' }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#FFD700'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#228B22'}
                        >
                          Pay
                        </Button>
                      ) : null
                    ),
                  },
                ]}
                pagination={false}
                scroll={{ x: 800 }}
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>
          <br />
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
