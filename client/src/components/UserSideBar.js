import React from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from 'react-router';
import { isAuthenticated } from '../actions/auth';
import { Card, Avatar, Row, Col, Statistic } from 'antd';

const { Meta } = Card;

const UserSideBar = ({
  followers,
  following,
  favourites,
  positiveRatings,
  negativeRatings,
  wallet,
  sellerCategories,
}) => {
  const { user } = isAuthenticated();

  const history = useHistory();
  const logout = () => {
    window.localStorage.removeItem('buynsell');
    history.push('/login');
    window.location.reload();
  };

  const urlLocation =
    history.location.pathname === '/user/favourites' ||
    history.location.pathname === '/user/follow-list';

  // Determine if user is a seller and has business info
  const isSeller = user && user.canSell;
  const displayLogo = isSeller && user.businessLogo ? user.businessLogo : user.photo;
  const displayName = isSeller && user.businessName ? user.businessName : user.name;
  const displayPhone = isSeller && user.businessPhone ? user.businessPhone : user.phone;
  const displayUsername = user.username;

  // Get social media links
  const socialMediaLinks = user.socialMediaLinks || {};

  return (
    <div className='col-md-3 mb-5'>
      <Card
        className='card-shadow'
        style={{ width: 'auto' }}
        cover={
          <Avatar
            src={displayLogo}
            className='mx-auto mt-3 avatar-user'
            size={130}
            style={isSeller && user.businessLogo ? { border: '3px solid #FFD700' } : {}}
          >
            {!displayLogo && displayName[0]}
          </Avatar>
        }
      >
        <div className='text-center'>
          {isSeller ? (
            <div>
              <h5 style={{ color: '#228B22', fontWeight: 'bold' }}>
                <i className='fas fa-store me-2'></i>
                {displayName}
              </h5>
              <small style={{ color: '#666' }}>({displayUsername})</small>
            </div>
          ) : (
            <h5>({displayUsername})</h5>
          )}
        </div>
        <Meta
          title={isSeller ? 'Business' : displayName}
          description={displayPhone}
          className='text-center user-details'
        />
        
        {/* Business Information for Sellers */}
        {isSeller && (
          <>
            {user.businessPhone && (
              <div className='text-center mt-2 bg-light'>
                <h6 className='p-1' style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                  <i className='fas fa-phone me-2'></i>
                  {user.businessPhone}
                </h6>
              </div>
            )}
            
            {/* Social Media Links */}
            {Object.keys(socialMediaLinks).length > 0 && (
              <div className='text-center mt-2 bg-light p-2'>
                <h6 style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px', fontSize: '12px' }}>
                  <i className='fas fa-share-alt me-2'></i>Social Media
                </h6>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {socialMediaLinks.facebook && (
                    <a href={socialMediaLinks.facebook} target='_blank' rel='noopener noreferrer' style={{ color: '#1877F2', fontSize: '18px' }}>
                      <i className='fab fa-facebook'></i>
                    </a>
                  )}
                  {socialMediaLinks.instagram && (
                    <a href={socialMediaLinks.instagram} target='_blank' rel='noopener noreferrer' style={{ color: '#E4405F', fontSize: '18px' }}>
                      <i className='fab fa-instagram'></i>
                    </a>
                  )}
                  {socialMediaLinks.twitter && (
                    <a href={socialMediaLinks.twitter} target='_blank' rel='noopener noreferrer' style={{ color: '#1DA1F2', fontSize: '18px' }}>
                      <i className='fab fa-twitter'></i>
                    </a>
                  )}
                  {socialMediaLinks.linkedin && (
                    <a href={socialMediaLinks.linkedin} target='_blank' rel='noopener noreferrer' style={{ color: '#0077B5', fontSize: '18px' }}>
                      <i className='fab fa-linkedin'></i>
                    </a>
                  )}
                  {socialMediaLinks.website && (
                    <a href={socialMediaLinks.website} target='_blank' rel='noopener noreferrer' style={{ color: '#333', fontSize: '18px' }}>
                      <i className='fas fa-globe'></i>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Seller Categories */}
            {sellerCategories && sellerCategories.length > 0 && (
              <div className='text-center mt-2 bg-light p-2'>
                <h6 style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px', fontSize: '12px' }}>
                  <i className='fas fa-tags me-2'></i>Categories ({sellerCategories.length})
                </h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
                  {sellerCategories.slice(0, 5).map((cat, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        fontSize: '10px', 
                        padding: '2px 6px', 
                        background: '#FFD700', 
                        color: '#228B22', 
                        borderRadius: '4px' 
                      }}
                    >
                      {cat.name || cat}
                    </span>
                  ))}
                  {sellerCategories.length > 5 && (
                    <span style={{ fontSize: '10px', color: '#666' }}>
                      +{sellerCategories.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Personal Information for Non-Sellers */}
        {!isSeller && user.location && user.location !== 'undefined' && (
          <div className='text-center mt-2 bg-light'>
            <h6 className='p-1' style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              <i className='fas fa-map-marker-alt me-2'></i>
              {user.location} State
            </h6>
          </div>
        )}
        
        {wallet && (
          <div className='text-center mt-2 bg-light'>
            <h6 className='p-1' style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              <i className='fas fa-wallet me-2'></i>
              Wallet: {wallet.substring(0, 10)}...
            </h6>
          </div>
        )}
        <div className='site-statistic-demo-card'>
          <Row gutter={16}>
            <Col span={12}>
              <Card className='d-flex justify-content-center stats-card'>
                <Statistic
                  className='text-center'
                  title='Followers'
                  value={followers.length}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card className='d-flex justify-content-center'>
                <Statistic
                  className='text-center'
                  title='Following'
                  value={following.length}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Card>
      <ul className='list-group rounded-0 profile-list card-shadow'>
        <Link
          to={`/rate/user/${user._id}`}
          className='text-dark1 text-dark-hover text-decoration-none'
        >
          {positiveRatings && negativeRatings && (
            <li className='list-group-item d-flex justify-content-between align-items-center text-dark1 text-dark-hover'>
              <i class='fas fa-star-half-alt me-1'></i>
              <span className='me-auto'> Reputation</span>
              <div className=''>
                <span className='text-success me-3'>
                  <i class='fas fa-thumbs-up'></i> ({positiveRatings.length})
                </span>
                <span className='text-danger'>
                  <i class='fas fa-thumbs-down'></i> ({negativeRatings.length})
                </span>
              </div>
            </li>
          )}
        </Link>
        {urlLocation && (
          <li className='list-group-item'>
            <Link
              to='/user/dashboard'
              className='text-dark1 text-dark-hover text-decoration-none'
            >
              <i class='fas fa-user'></i> User Dashboard
            </Link>
          </li>
        )}
        {user.role === 'admin' && (
          <li className='list-group-item'>
            <Link
              to='/admin/dashboard'
              className='text-dark1 text-dark-hover text-decoration-none'
            >
              <i class='fas fa-user-shield'></i> Admin Dashboard
            </Link>
          </li>
        )}
        <li className='list-group-item'>
          <Link
            to={`/user/edit/${user._id}`}
            className='text-dark1 text-dark-hover text-decoration-none'
          >
            <i class='fas fa-user-cog me-1'></i>Profile Settings
          </Link>
        </li>
        <Link
          to='/user/favourites'
          className='text-dark1 text-dark-hover text-decoration-none'
        >
          <li className='list-group-item text-dark-hover d-flex justify-content-between align-items-center text-dark1'>
            <i class='fas fa-heart me-1'></i>{' '}
            <span className='me-auto'>Favourites</span>
            <span class='badge badge-pill bg-success'>{favourites.length}</span>
          </li>
        </Link>
        <li className='list-group-item'>
          <Link
            to='/user/follow-list'
            className='text-dark1 text-dark-hover text-decoration-none'
          >
            <i class='fas fa-users me-1'></i>Follow List
          </Link>
        </li>
        {/* <li className='list-group-item'>
          <Link
            to='/user/business'
            className='text-dark1 text-dark-hover text-decoration-none'
          >
            <i class='fas fa-address-card'></i> Business Info
          </Link>
        </li> */}
        <li
          className='list-group-item text-dark1 text-dark-hover'
          role='button'
          onClick={logout}
        >
          <i class='fas fa-sign-out-alt'></i> Logout
        </li>
      </ul>
    </div>
  );
};

export default UserSideBar;
