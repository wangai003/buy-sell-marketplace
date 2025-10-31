import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated } from '../actions/auth';
import { Tooltip, message, Descriptions, Card, Avatar, Button, Modal, Select, Input, List, Typography } from 'antd';
import moment from 'moment';
import {
  singleProduct,
  addFavourite,
  removeFavourite,
  favouriteCount,
  createPayment,
  createNowpaymentsInvoice,
  placeBid,
  getBids,
} from '../actions/product';
import ReportProduct from '../components/ReportProduct';
import { viewUser } from '../actions/user';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import RelatedProducts from './RelatedProducts';
import { useDispatch, useSelector } from 'react-redux';
import QRCode from 'react-qr-code';
import { fetchConvertedPrice } from '../actions/currency';

const { Option } = Select;
const { Meta } = Card;

const ViewProduct = ({ match, history }) => {
  const dispatch = useDispatch();
  const { selectedCurrency } = useSelector((state) => state.buynsellCurrency);
  const [product, setProduct] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [productLocation, setProductLocation] = useState([]);
  const [productAuthor, setProductAuthor] = useState([]);
  const [productAuthorName, setProductAuthorName] = useState([]);
  const [productReports, setProductReports] = useState([]);
  const [reported, setReported] = useState(false);
  const [category, setCategory] = useState('');
  const [favourites, setFavourites] = useState([]);
  const [favourite, setFavourite] = useState(false);
  const [favCount, setFavCount] = useState(null);
  const [showWidget, setShowWidget] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [widgetAddress, setWidgetAddress] = useState('');
  const [widgetAmount, setWidgetAmount] = useState('');
  const [widgetCurrency, setWidgetCurrency] = useState('');
  const [payCurrency, setPayCurrency] = useState('XLM'); // default: XLM
  const [currencies, setCurrencies] = useState(['XLM', 'USDC', 'EURC', 'AKOFA']);
  const [stellarPay, setStellarPay] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isGoodsCategory, setIsGoodsCategory] = useState(false);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [convertedPrices, setConvertedPrices] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState('USDC');

  const { user, token } = isAuthenticated();

  useEffect(() => {
    loadCurrencies();
    loadProduct();
    loadUser();
    loadFavouriteCount();
    loadBids();
  }, [favourite, reported, match.params.productId]);

  useEffect(() => {
    const symbol = selectedCurrency === 'USDC' ? 'USDC' : selectedCurrency;
    setCurrencySymbol(symbol);
  }, [selectedCurrency]);

  useEffect(() => {
    if (product.price) {
      fetchConvertedPrices();
    }
  }, [selectedCurrency, product.price, product.startingBid, product.currentBid]);

  const fetchConvertedPrices = async () => {
    if (!product.price) return;
    try {
      const prices = {};
      const priceFields = ['price', 'startingBid', 'currentBid'];
      for (const field of priceFields) {
        if (product[field]) {
          prices[field] = await fetchConvertedPrice(product[field], 'USDC', selectedCurrency);
        }
      }
      setConvertedPrices(prices);
    } catch (error) {
      console.error('Error fetching converted prices:', error);
    }
  };

  useEffect(() => {
    if (product.endTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const endTime = new Date(product.endTime).getTime();
        const distance = endTime - now;

        if (distance > 0) {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft('Auction Ended');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [product.endTime]);

  const loadCurrencies = async () => {
    // Use fixed currencies for Stellar payments
    setCurrencies(['XLM', 'USDC', 'EURC', 'AKOFA']);
  };

  const loadUser = async () => {
    if (user && token) {
      const res = await viewUser(user._id);
      setFavourites(res.data.favourites);
    }
  };

  const loadProduct = async () => {
    const res = await singleProduct(match.params.productId);
    setProduct(res.data);
    setCategory(res.data.category);
    setProductLocation(res.data.location);
    setProductAuthor(res.data.author);
    setProductAuthorName(res.data.author.name);
    var imageArray = res.data.images
      .slice(0)
      .map((item, index) => ({ original: item, thumbnail: item }));
    setProductImages(imageArray);

    const reportArray = [];
    res.data.reports.map((item) => reportArray.push(item.author));
    setProductReports(reportArray);

    // Check if product is in "Goods" category
    const isGoods = res.data.category && res.data.category.name === 'Goods';
    setIsGoodsCategory(isGoods);

    dispatch({
      type: 'PRODUCT_DETAILS',
      payload: res.data.category,
    });
  };

  const loadFavouriteCount = async () => {
    const res = await favouriteCount(match.params.productId);
    setFavCount(res.data);
  };

  const loadBids = async () => {
    if (product.isAuction) {
      const res = await getBids(match.params.productId);
      setBids(res.data);
    }
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= (product.currentBid || product.startingBid || 0)) {
      message.error('Bid must be higher than current bid');
      return;
    }

    try {
      const { token } = isAuthenticated();
      const res = await placeBid(match.params.productId, { amount: parseFloat(bidAmount), user }, token);
      message.success('Bid placed successfully!');
      setBidAmount('');
      loadBids(); // Refresh bids
      loadProduct(); // Refresh product to get updated currentBid
    } catch (err) {
      message.error('Failed to place bid');
    }
  };

  const handleAddFavourite = async (productId) => {
    const res = await addFavourite(productId, { user, token });
    console.log(res.data);
    message.success('Added to Favourites');
    setFavourite(!favourite);
  };
  const handleRemoveFavourite = async (productId) => {
    const res = await removeFavourite(productId, { user, token });
    console.log(res.data);
    setFavourite(!favourite);
  };

  const handlePayWithStellar = async () => {
    setPaying(true);
    try {
      const { token } = isAuthenticated();
      const res = await fetch(`${process.env.REACT_APP_API}/payment/stellar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id,
          buyerId: user._id,
          sellerId: productAuthor._id,
          quantity: isGoodsCategory ? quantity : 1,
          currency: selectedCurrency
        }),
      });
      const data = await res.json();
      setStellarPay({
        ...data,
        currency: selectedCurrency,
      });
      setPaymentStatus('AWAITING_PAYMENT');
      // Optionally start polling
      pollStellarPaymentStatus(data.orderId);
    } catch(e){
      setPaymentStatus('FAILED');
    }
    setPaying(false);
  };

  const handleCurrencyChange = (value) => {
    dispatch({
      type: 'SET_SELECTED_CURRENCY',
      payload: value,
    });
    localStorage.setItem('selectedCurrency', value);
  };

  const pollStellarPaymentStatus = (orderId) => {
    const poll = setInterval(async () => {
      const { token } = isAuthenticated();
      const res = await fetch(`${process.env.REACT_APP_API}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if(data.status === 'PAID'){
        setPaymentStatus('PAID');
        clearInterval(poll);
      }
    }, 5000);
  };

  //format currency
  Number.prototype.format = function (n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
  };

  return (
    <>
      <div className='row mb-4 mt-3 container-fluid profile-container mx-auto product-carousel' style={{
        background: 'linear-gradient(to right, #FFD700, #FFFFFF)',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}>
        <Breadcrumb style={{ marginBottom: '20px' }}>
          <Breadcrumb.Item>
            <Link to='/' className='text-decoration-none' style={{ color: '#FFFFFF' }}>
              Home
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link
              to={`/category/${category._id}`}
              className='text-decoration-none'
              style={{ color: '#FFFFFF' }}
            >
              {category.name}
            </Link>
          </Breadcrumb.Item>
        </Breadcrumb>
        <div className='col-md-9 mx-auto mb-4' style={{
          background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          transition: 'transform 0.3s ease'
        }}>
          <ImageGallery
            items={productImages}
            showPlayButton={false}
            showFullscreenButton={false}
          />
          <div className='d-flex justify-content-between align-items-center p-3' style={{
            background: 'rgba(255,255,255,0.9)'
          }}>
            <span>
              <h1 className='text-dark1' style={{
                fontSize: '1.4rem',
                color: '#FFFFFF',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                {product.name}
              </h1>
            </span>
            {user && token && (
              <div className='d-flex'>
                <div>
                  {favourites.includes(product._id) && (
                    <Tooltip title='Remove from Favourites'>
                      <span
                        className='single-product-fav'
                        onClick={() => handleRemoveFavourite(product._id)}
                        role='button'
                        style={{
                          borderRadius: '50%',
                          border: '2px solid #33b27b',
                          padding: '8px',
                          background: '#FFFFFF',
                          color: '#33b27b',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { e.target.style.background = '#33b27b'; e.target.style.color = '#FFFFFF'; }}
                        onMouseLeave={(e) => { e.target.style.background = '#FFFFFF'; e.target.style.color = '#33b27b'; }}
                      >
                        <i class='fas fa-star'></i>
                      </span>
                    </Tooltip>
                  )}
                  {!favourites.includes(product._id) && (
                    <Tooltip title='Add to Favourites'>
                      <span
                        className='single-product-fav'
                        onClick={() => handleAddFavourite(product._id)}
                        role='button'
                        style={{
                          borderRadius: '50%',
                          border: '2px solid #33b27b',
                          padding: '8px',
                          background: '#FFFFFF',
                          color: '#33b27b',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { e.target.style.background = '#33b27b'; e.target.style.color = '#FFFFFF'; }}
                        onMouseLeave={(e) => { e.target.style.background = '#FFFFFF'; e.target.style.color = '#33b27b'; }}
                      >
                        <i class='far fa-star fa-star-text'></i>
                      </span>
                    </Tooltip>
                  )}
                </div>
                <div style={{ marginLeft: '10px' }}>
                  <span style={{
                    background: '#33b27b',
                    color: '#FFFFFF',
                    padding: '4px 8px',
                    borderRadius: '10px',
                    fontSize: '12px'
                  }}>
                    {favCount}
                  </span>
                </div>
                {user._id !== productAuthor._id && (
                  <div style={{ marginLeft: '10px' }}>
                    <Button
                      type='primary'
                      danger
                      size='small'
                      style={{
                        background: 'linear-gradient(to right, #33b27b, #28a745)',
                        border: 'none',
                        color: '#FFFFFF',
                        borderRadius: '20px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      onClick={() =>
                        history.push(`/messages?&message=${productAuthor._id}`)
                      }
                    >
                      <i class='fas fa-envelope me-1'></i> Message
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <small style={{
            background: 'rgba(255,255,255,0.9)',
            padding: '10px'
          }}>
            <div className='d-flex justify-content-between'>
              <div className='d-flex'>
                <p class='text-muted ps-3 pe-4'>
                  <i class='far fa-clock pe-1'></i>Posted{' '}
                  {moment(product.createdAt).fromNow()}
                </p>
                <Link
                  to={`/search-result?&location=${productLocation._id}&category=&name=&price=&condition=`}
                  className='text-decoration-none'
                >
                  <p className='text-muted' style={{ fontSize: '14px' }}>
                    <i class='fas fa-map-marker-alt me-2'></i>
                    {productLocation.name}
                  </p>
                </Link>
              </div>

              <span className='me-3'>
                <p className='text-muted' style={{ fontSize: '15px', color: '#33b27b', fontWeight: 'bold' }}>
                  {product.isAuction ? (
                    <>
                      Current Bid: {currencySymbol}{parseInt(convertedPrices.currentBid || convertedPrices.startingBid || product.currentBid || product.startingBid).format()}
                      {timeLeft && <br />}<small style={{ color: '#666' }}>Time Left: {timeLeft}</small>
                    </>
                  ) : (
                    `${currencySymbol}${parseInt(convertedPrices.price || product.price).format()}`
                  )}
                </p>
              </span>
            </div>
          </small>
          <div className='pe-2 ps-2 mb-5' style={{
            background: 'rgba(255,255,255,0.9)'
          }}>
            <Descriptions bordered style={{ background: 'transparent' }}>
              <Descriptions.Item label='Category' style={{ color: '#333' }}>
                {category.name}
              </Descriptions.Item>
              {product.condition !== '' && (
                <Descriptions.Item label='Condition' style={{ color: '#333' }}>
                  {product.condition}
                </Descriptions.Item>
              )}
              <Descriptions.Item label='Seller' style={{ color: '#333' }}>
                {productAuthor.name}
              </Descriptions.Item>
              <Descriptions.Item label='Product Status' style={{ color: '#333' }}>
                <span className='capitalize'>{product.status}</span>
              </Descriptions.Item>
              <Descriptions.Item label='Price' style={{ color: '#33b27b', fontWeight: 'bold' }}>
                {currencySymbol}{parseInt(convertedPrices.price || product.price).format()}
              </Descriptions.Item>
              {product.isAuction && (
                <>
                  <Descriptions.Item label='Starting Bid' style={{ color: '#333' }}>
                    {currencySymbol}{parseInt(convertedPrices.startingBid || product.startingBid).format()}
                  </Descriptions.Item>
                  <Descriptions.Item label='Current Bid' style={{ color: '#33b27b', fontWeight: 'bold' }}>
                    {currencySymbol}{parseInt(convertedPrices.currentBid || product.currentBid || product.startingBid).format()}
                  </Descriptions.Item>
                  <Descriptions.Item label='End Time' style={{ color: '#333' }}>
                    {moment(product.endTime).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label='Last Updated' style={{ color: '#333' }}>
                {moment(product.updatedAt).fromNow()}
              </Descriptions.Item>
            </Descriptions>
            <h3 className='pt-3 ps-2 pe-2' style={{
              fontSize: '1rem',
              color: '#FFFFFF',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>
              <strong>Description</strong>
            </h3>
            <p
              className='ps-2 pe-2'
              style={{ fontSize: '0.89rem', lineHeight: '1.5rem' }}
            >
              {product.description}
            </p>
          </div>
        </div>
        {category && <RelatedProducts category={category._id} />}
        <div className='col-md-3'>
          <div className='card rounded-0 profile-card' style={{
            background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease',
            ':hover': {
              transform: 'translateY(-5px)'
            }
          }}>
            <Card
              style={{ width: 'auto', marginBottom: '-9px' }}
              className='border-0'
              cover={
                <Avatar
                  src={productAuthor.photo}
                  className='mx-auto mt-3 avatar-user'
                  size={120}
                  style={{ marginBottom: '-13px' }}
                >
                  {productAuthorName[0]}
                </Avatar>
              }
            >
              <Meta
                title={productAuthorName}
                description={
                  user && token ? (
                    <Tooltip title={`Call ${productAuthorName}`}>
                      <a
                        href={`tel:${productAuthor.phone}`}
                        className='text-decoration-none text-dark1 text-muted bg-light text-center p-2 pe-5 ps-5 bg-light'
                      >
                        <i class='fas fa-phone-alt'></i>{' '}
                        <span>{productAuthor.phone}</span>
                      </a>
                    </Tooltip>
                  ) : (
                    <span className='text-dark1 bg-light text-center p-2 pe-2 ps-2 bg-light'>
                      {' '}
                      <i>Login to view seller number..</i>
                    </span>
                  )
                }
                className='text-center user-details'
              />
              <span className='d-flex justify-content-center align-items-center mt-3'>
                <div className='text-dark1 me-2' style={{ fontSize: '15px' }}>
                  Joined
                </div>{' '}
                <span style={{ color: '#3f8600', fontSize: '15px' }}>
                  {moment(productAuthor.createdAt).fromNow()}
                </span>
              </span>
            </Card>
            {user && user._id !== productAuthor._id && (
              <div className='pe-4 ps-4 mb-4'>
                <div className='d-flex justify-content-between mb-3'>
                  <div>
                    <Link to={`/user/${productAuthor._id}`}>
                      <Button
                        type='primary'
                        danger
                        // shape='round'
                        style={{
                          backgroundColor: '#33b27b',
                          borderColor: '#33b27b',
                          color: '#ffffff',
                        }}
                      >
                        Seller Profile
                      </Button>
                    </Link>
                  </div>
                  <div>
                    <Button
                      type='primary'
                      danger
                      // shape='round'
                      style={{
                        backgroundColor: '#33b27b',
                        borderColor: '#33b27b',
                        color: '#ffffff',
                      }}
                      onClick={() =>
                        history.push(`/messages?&message=${productAuthor._id}`)
                      }
                    >
                      <i class='fas fa-envelope me-2'></i> Message
                    </Button>
                  </div>
                </div>
                <div className='d-flex justify-content-center flex-column'>
                  {isGoodsCategory && (
                    <div className='mb-3'>
                      <label className='form-label'>Quantity:</label>
                      <div className='d-flex align-items-center justify-content-center'>
                        <Button
                          size='small'
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          -
                        </Button>
                        <span className='mx-3 fw-bold'>{quantity}</span>
                        <Button
                          size='small'
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <div className='mt-2 text-center'>
                        <small className='text-muted'>
                          Total: {selectedCurrency === 'USDC' ? 'USDC' : selectedCurrency}{(parseInt(convertedPrices.price || product.price) * quantity).format()}
                        </small>
                      </div>
                    </div>
                  )}
                  {product.isAuction ? (
                    <>
                      {user && user._id !== productAuthor._id && product.status === 'active' && timeLeft !== 'Auction Ended' && (
                        <div className='mb-3'>
                          <Input
                            type='number'
                            placeholder={`Min bid: ${currencySymbol}${(parseInt(convertedPrices.currentBid || convertedPrices.startingBid || product.currentBid || product.startingBid) + 1).format()}`}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            style={{ marginBottom: '10px' }}
                          />
                          <Button type='primary' onClick={handlePlaceBid} disabled={!bidAmount}>
                            Place Bid
                          </Button>
                        </div>
                      )}
                      {product.status === 'closed' && (
                        <div className='alert alert-info'>
                          Auction Ended - Winner: {bids.length > 0 ? bids[0].bidder.name : 'No bids'}
                        </div>
                      )}
                      {product.status === 'active' && timeLeft === 'Auction Ended' && (
                        <div className='alert alert-warning'>
                          Auction has ended. Waiting for seller to close.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className='mb-3'>
                        <label className='form-label'>Select Payment Currency:</label>
                        <Select
                          value={selectedCurrency}
                          onChange={handleCurrencyChange}
                          style={{ width: '100%' }}
                          placeholder="Select currency"
                        >
                          <Select.Option value="USDC">USDC</Select.Option>
                          <Select.Option value="EURC">EURC</Select.Option>
                          <Select.Option value="XLM">XLM</Select.Option>
                          <Select.Option value="AKOFA">AKOFA</Select.Option>
                        </Select>
                      </div>
                      <Button type='primary' onClick={handlePayWithStellar} disabled={paying || paymentStatus === 'AWAITING_PAYMENT'}>
                        Pay with Stellar {isGoodsCategory && `(${quantity}x)`}
                      </Button>
                      {paymentStatus === 'AWAITING_PAYMENT' && (
                        <div className='mt-2'>
                          <small className='text-warning'>Payment initiated. Complete the payment to enable this button again.</small>
                        </div>
                      )}
                    </>
                  )}
                  {stellarPay && (
                    <div className='mt-3'>
                      <p><strong>Send {parseInt(convertedPrices.price || product.price).format()} {currencySymbol} to:</strong></p>
                      <div className='d-flex align-items-center mb-2'>
                        <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', flex: 1, marginRight: '8px' }}>
                          GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A
                        </p>
                        <Button
                          size='small'
                          onClick={() => {
                            navigator.clipboard.writeText('GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A');
                            message.success('Wallet address copied!');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <div className='d-flex align-items-center mb-3'>
                        <p style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', flex: 1, marginRight: '8px' }}>
                          <strong>Memo:</strong> {stellarPay.memo}
                        </p>
                        <Button
                          size='small'
                          onClick={() => {
                            navigator.clipboard.writeText(stellarPay.memo);
                            message.success('Memo copied!');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <div className='text-center my-3'>
                        <QRCode value={stellarPay.sep7} size={180} />
                      </div>
                      <div className='text-center'>
                        <a href={stellarPay.sep7} target='_blank' rel='noopener noreferrer' className='btn btn-primary btn-sm'>
                          Open in Stellar Wallet
                        </a>
                      </div>
                      <p className='mt-2'><strong>Status:</strong> {paymentStatus}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className='card rounded-0 profile-card mt-3' style={{
            background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease',
            ':hover': {
              transform: 'translateY(-5px)'
            }
          }}>
            <div className='pe-2 ps-2 pt-2'>
              <span className='text-center text-dark1 ps-4'>
                <strong>Safety tips</strong>
              </span>
              <span>
                <ul>
                  <li>Do not pay in advance even for the delivery</li>
                  <li>Try to meet at a safe, public location</li>
                  <li>Check the item BEFORE you buy it</li>
                  <li>Pay only after collecting the item</li>
                </ul>
              </span>
            </div>
          </div>
          {user && token && user._id !== productAuthor._id && (
            <ReportProduct
              product={product}
              productReports={productReports}
              productId={match.params.productId}
              setReported={setReported}
            />
          )}
        </div>
        {product.isAuction && bids.length > 0 && (
          <div className='col-md-3'>
            <div className='card rounded-0 profile-card mt-3' style={{
              background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
              borderRadius: '10px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease',
              ':hover': {
              transform: 'translateY(-5px)'
            }
            }}>
              <div className='pe-2 ps-2 pt-2'>
                <span className='text-center text-dark1 ps-4'>
                  <strong>Bid History</strong>
                </span>
                <List
                  size='small'
                  dataSource={bids}
                  renderItem={(bid) => (
                    <List.Item>
                    <Typography.Text strong>{bid.bidder.name}</Typography.Text> - {currencySymbol}{parseInt(convertedPrices.bids?.[bid._id] || bid.amount).format()}
                    <br />
                    <small className='text-muted'>{moment(bid.timestamp).fromNow()}</small>
                  </List.Item>
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <Modal
        visible={showWidget}
        open={showWidget}
        onCancel={() => setShowWidget(false)}
        footer={null}
        title='Complete your payment'
        width={720}
      >
        {invoiceUrl && (
          <iframe
            src={invoiceUrl}
            title='NOWPayments Invoice'
            style={{ width: '100%', height: '70vh', border: 'none' }}
            allowFullScreen
            onError={() => {
              window.open(invoiceUrl, '_blank');
              setShowWidget(false);
            }}
          />
        )}
        {invoiceUrl && (
          <div className='mt-2'>
            <a href={invoiceUrl} target='_blank' rel='noreferrer'>Open invoice in a new tab</a>
          </div>
        )}
        {!invoiceUrl && (widgetAddress || widgetAmount) && (
          <div>
            <div className='mb-2'><strong>Send {widgetAmount || '—'} {widgetCurrency.toUpperCase()} to:</strong></div>
            <div style={{ wordBreak: 'break-all' }} className='mb-2'>{widgetAddress || 'Address will appear shortly.'}</div>
            <div className='d-flex'>
              <Button size='small' onClick={() => navigator.clipboard.writeText(widgetAddress)}>Copy Address</Button>
              <Button size='small' className='ms-2' onClick={() => navigator.clipboard.writeText(widgetAmount)}>Copy Amount</Button>
            </div>
            <div className='mt-3 text-muted' style={{ fontSize: 12 }}>
              After sending, the payment status will update automatically.
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ViewProduct;
