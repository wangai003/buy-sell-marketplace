import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated } from '../actions/auth';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
  viewUser,
  followUser,
  unfollowUser,
  userActiveProducts,
} from '../actions/user';
import { Card, Avatar, Button, Pagination, Empty } from 'antd';

const { Meta } = Card;

const ViewUser = ({ match, history }) => {
  const countPerPage = 5;
  const [values, setValues] = useState({
    _id: '',
    name: '',
    username: '',
    phone: '',
    photo: '',
    location: '',
    followers: '',
    products: [],
    createdAt: '',
  });
  const [activeProducts, setActiveProducts] = useState([]);
  const [following, setFollowing] = useState(null);
  const [positiveRatings, setpositiveRatings] = useState([]);
  const [negativeRatings, setnegativeRatings] = useState([]);
  const [current, setCurrent] = useState();
  const [pagination, setPagination] = useState();
  const positiveRating = [];
  const negativeRating = [];

  const {
    _id,
    followers,
    name,
    username,
    phone,
    photo,
    location,
    products,
    createdAt,
  } = values;
  const { user, token } = isAuthenticated();

  const loadUser = async () => {
    let res = await viewUser(match.params.userId);
    setValues({
      ...values,
      ...res.data,
    });
    res.data.ratings.forEach((item) => {
      if (item.rating === 'positive') {
        positiveRating.push(item._id);
        setpositiveRatings(positiveRating);
      } else if (item.rating === 'negative') {
        negativeRating.push(item._id);
        setnegativeRatings(negativeRating);
      }
    });
  };

  const loadUserActiveProducts = async (page) => {
    let res = await userActiveProducts(match.params.userId);
    setCurrent(page);
    const to = page * countPerPage;
    const from = to - countPerPage;
    setPagination(res.data.slice(from, to));
    setActiveProducts(res.data);
  };

  useEffect(() => {
    loadUser();
    loadUserActiveProducts(1);
  }, [following]);

  const handleFollow = async () => {
    try {
      let res = await followUser(match.params.userId, user, token);
      console.log(res);
      setFollowing(true);
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) toast.error(err.response.data);
    }
  };

  const handleUnfollow = async () => {
    try {
      let res = await unfollowUser(match.params.userId, user, token);
      console.log(res);
      setFollowing(false);
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) toast.error(err.response.data);
    }
  };

  //format currency
  Number.prototype.format = function (n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
  };

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
      borderRadius: '8px',
    },
    cardHover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    },
    title: {
      color: '#228B22',
      fontSize: '1.5rem',
    },
    text: {
      color: '#228B22',
    },
    button: {
      background: 'linear-gradient(to right, #32CD32, #228B22)',
      border: 'none',
      color: 'white',
      transition: 'all 0.3s ease',
    },
    buttonHover: {
      background: 'linear-gradient(to right, #228B22, #32CD32)',
    },
    listItem: {
      backgroundColor: 'white',
      border: '1px solid #FFD700',
      transition: 'all 0.3s ease',
    },
    listItemHover: {
      backgroundColor: '#f8f9fa',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
  };

  return (
    <>
      <div className='row container-fluid mx-auto mt-5 mb-5 profile-container' style={styles.container}>
        <div className='col-md-3 mb-2'>
          <Card
            className='card-shadow'
            style={{ width: 'auto', ...styles.card }}
            cover={
              <Avatar
                src={photo}
                className='mx-auto mt-3 avatar-user'
                size={130}
              >
                {name[0]}
              </Avatar>
            }
          >
            <div className='text-center'>
              <h5 style={styles.text}>({username})</h5>
            </div>
            <Meta
              title={name}
              description={phone}
              className='text-center user-details'
            />
            {user._id !== _id && (
              <>
                <div className='mx-auto mt-3 d-flex justify-content-evenly text-center'>
                  {followers.includes(user._id) && (
                    <Button
                      type='primary'
                      danger
                      shape='round'
                      onClick={handleUnfollow}
                      style={styles.button}
                    >
                      UNFOLLOW
                    </Button>
                  )}
                  {!followers.includes(user._id) && (
                    <Button
                      type='primary'
                      danger
                      shape='round'
                      onClick={handleFollow}
                      style={styles.button}
                    >
                      FOLLOW
                    </Button>
                  )}

                  <Button
                    type='primary'
                    danger
                    shape='round'
                    onClick={() => history.push(`/messages?&message=${_id}`)}
                    style={styles.button}
                  >
                    MESSAGE
                  </Button>
                </div>
                <div className='d-flex justify-content-center align-items-center mt-3 bg-light' style={{...styles.card, border: '1px solid #FFD700'}}>
                  <div className='text-dark1 m-2' style={{ fontSize: '15px', color: '#228B22' }}>
                    Joined
                  </div>{' '}
                  <span style={{ color: '#228B22', fontSize: '15px' }}>
                    {moment(createdAt).fromNow()}
                  </span>
                </div>
                {location && location !== 'undefined' && (
                  <div className='text-center mt-2 bg-light' style={{...styles.card, border: '1px solid #FFD700'}}>
                    <h6
                      className='p-1'
                      style={{ color: '#228B22' }}
                    >
                      <i class='fas fa-map-marker-alt me-2'></i>
                      {location} State
                    </h6>
                  </div>
                )}
                <div className='row'>
                  <div className='col-10 mx-auto'>
                    <Link
                      to={`/rate/user/${_id}`}
                      className='text-decoration-none'
                    >
                      <div className='mt-3 d-flex justify-content-center'>
                        <div className='btn btn-outline-success btn-sm form-control' style={{border: '1px solid #FFD700', color: '#228B22'}}>
                          <i class='fas fa-thumbs-up'></i> Rate {username}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </Card>
          <ul className='list-group rounded-0 profile-list card-shadow' style={styles.card}>
            <Link
              to={`/rate/user/${_id}`}
              className='text-dark1 text-dark-hover text-decoration-none'
            >
              <li className='list-group-item d-flex justify-content-between align-items-center text-dark1 text-dark-hover' style={styles.listItem}>
                <i class='fas fa-star-half-alt me-1'></i>
                <span className='me-auto'> Reputation</span>
                <div className=''>
                  <span className='text-success me-3'>
                    <i class='fas fa-thumbs-up'></i> ({positiveRatings.length})
                  </span>
                  <span className='text-danger'>
                    <i class='fas fa-thumbs-down'></i> ({negativeRatings.length}{' '}
                    )
                  </span>
                </div>
              </li>
            </Link>
            <li className='list-group-item d-flex justify-content-between align-items-center text-dark1' style={styles.listItem}>
              <i class='fas fa-users me-1'></i>{' '}
              <span className='me-auto'>Followers</span>
              <span class='badge badge-pill bg-warning'>
                {followers.length}
              </span>
            </li>
            <li className='list-group-item d-flex justify-content-between align-items-center text-dark1' style={styles.listItem}>
              <i class='fas fa-th-list me-1'></i>{' '}
              <span className='me-auto'>Product Count</span>
              <span class='badge badge-pill bg-success'>{products.length}</span>
            </li>
          </ul>
        </div>
        <div className='col-md-9'>
          <div className='card rounded-0 profile-card card-shadow' style={styles.card}>
            <div className='card-header profile-card p-3' style={{...styles.card, borderBottom: '1px solid #FFD700'}}>
              <h3 style={styles.title}>{username}'s Products</h3>
            </div>
            {activeProducts.length === 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
            {activeProducts.length > 0 && (
              <div className='card-body desktop-product-view'>
                {pagination.map((p, i) => {
                  return (
                    <div class='card rounded-0 mb-3 product-card' key={i}>
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
                          {/* <Tooltip title='Add to Favourites'>
                              <span
                                className='product-fav d-flex align-items-center justify-content-center'
                                role='button'
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  border: '1px solid rgba(0, 0, 0, 0.125)',
                                }}
                              >
                                <i class='far fa-star fa-star-text'></i>
                              </span>
                            </Tooltip> */}
                        </div>
                        <div class='col-md-9'>
                          <div class='card-body pt-3 pb-2'>
                            <div className='d-flex justify-content-between'>
                              <Link
                                to={`/product/${p._id}`}
                                className='text-decoration-none'
                              >
                                <h6 class='card-title text-dark1'>{p.name}</h6>
                              </Link>
                              <span>
                                <h6 className='text-success'>
                                  USDC{parseInt(p.price).format()}
                                </h6>
                              </span>
                            </div>
                            <small>
                              <p class='card-text text-muted'>
                                {p.description.substring(0, 85)}..
                              </p>
                            </small>
                            <div className='d-flex mt-4 product-cat-text'>
                              <span>
                                <Link
                                  to={`/category/${p.category._id}`}
                                  className='badge badge-pill text-muted me-2 text-decoration-none'
                                  style={{
                                    backgroundColor: '#eef2f4',
                                    color: '#303a4b',
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
                                    backgroundColor: '#eef2f4',
                                    color: '#303a4b',
                                  }}
                                >
                                  {p.condition}
                                </div>
                              </span>
                            </div>
                            <div class='card-text d-flex justify-content-between'>
                              <Link
                                to={`/search-result?&location=${p.location._id}&category=&name=&price=&condition=`}
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
                                {moment(p.createdAt).fromNow()} by{' '}
                                <Link
                                  to={`/user/${p.author._id}`}
                                  className='text-decoration-none text-dark1'
                                >
                                  {p.author.name}
                                </Link>
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Pagination
                  pageSize={countPerPage}
                  onChange={loadUserActiveProducts}
                  defaultCurrent={current}
                  total={activeProducts.length}
                />
              </div>
            )}

            {activeProducts.length > 0 && (
              <div className='card-body mobile-product'>
                {pagination.map((p, i) => {
                  if (p.status === 'active') {
                    return (
                      <div
                        className='card card-shadow rounded-0 mb-3 mobile-product-view d-flex flex-row'
                        style={{ height: '12.43rem' }}
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
                              <h6 className='text-success'>
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
                                    backgroundColor: '#eef2f4',
                                    color: '#303a4b',
                                  }}
                                >
                                  {p.category.name}
                                </Link>
                              </span>
                              <span>
                                <div
                                  className='badge badge-pill text-muted'
                                  style={{
                                    backgroundColor: '#eef2f4',
                                    color: '#303a4b',
                                  }}
                                >
                                  {p.condition}
                                </div>
                              </span>
                            </div>
                          </div>
                          <div className='mb-3'>
                            <small class='text-muted'>
                              By:{' '}
                              <Link
                                to={`/user/${p.author._id}`}
                                className='text-decoration-none text-dark1'
                              >
                                {p.author.username}
                              </Link>
                            </small>
                          </div>
                          <div class='card-text d-flex justify-content-between align-items-center mt-1'>
                            <div>
                              <Link
                                to={`/search-result?&location=${p.location._id}&category=&name=&price=&condition=`}
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
                  onChange={loadUserActiveProducts}
                  defaultCurrent={current}
                  total={activeProducts.length}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewUser;
