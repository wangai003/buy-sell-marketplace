import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'react-multi-carousel/lib/styles.css';
import { Tooltip } from 'antd';
import { relatedProducts } from '../actions/product';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

const RelatedProducts = ({ category }) => {
  const [related, setRelated] = useState([]);

  const loadRelated = async () => {
    const res = await relatedProducts(category);
    setRelated(res.data);
  };

  useEffect(() => {
    loadRelated();
  }, []);

  //format currency
  Number.prototype.format = function (n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
  };

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 3000 },
      items: 5,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  return (
    <div style={{
      background: 'linear-gradient(to right, #FFD700, #FFFFFF)',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <div>
        <h3 style={{
          fontSize: '22px',
          color: '#FFFFFF',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          marginBottom: '20px',
          marginLeft: '10px'
        }}>
          Related Products
        </h3>
      </div>
      <Carousel responsive={responsive}>
        {related.map((p, i) => {
          if (p.status === 'active') {
            return (
              <div key={i} style={{
                transition: 'transform 0.3s ease',
                ':hover': {
                  transform: 'scale(1.05)'
                }
              }}>
                <div style={{
                  width: '98%',
                  background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
                  borderRadius: '10px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  marginBottom: '20px',
                  transition: 'transform 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-5px)'
                  }
                }}>
                  <div className='product-img1'>
                    <Link
                      to={`/product/${p._id}`}
                      className='text-decoration-none'
                    >
                      <img
                        src={p.images[0]}
                        className='card-img-top img-top-related'
                        alt={p.name}
                        style={{
                          borderBottom: '1px solid rgba(0,0,0,.125)',
                        }}
                      />
                      <span className='product-img-count'>
                        <span style={{
                          background: '#33b27b',
                          color: '#FFFFFF',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '12px'
                        }}>
                          {p.images.length}
                          <i class='fas fa-images ps-1'></i>
                        </span>
                      </span>
                    </Link>
                  </div>
                  <div className='card-body pb-0' style={{
                    background: 'rgba(255,255,255,0.9)',
                    padding: '15px'
                  }}>
                    <div className='d-flex justify-content-between flex-wrap'>
                      <Tooltip title={p.name}>
                        <Link
                          to={`/product/${p._id}`}
                          className='text-decoration-none'
                        >
                          <p style={{
                            color: '#333',
                            fontWeight: 'bold',
                            margin: '0'
                          }}>
                            {p.name}
                          </p>
                        </Link>
                      </Tooltip>
                      <span>
                        <p style={{
                          color: '#33b27b',
                          fontWeight: 'bold',
                          margin: '0'
                        }}>
                          USDC{parseInt(p.price).format()}
                        </p>
                      </span>
                    </div>
                    <span class='card-text d-flex justify-content-between mt-2'>
                      <Link
                        to={`/search-result?&location=${p.location._id}&category=&name=&price=&condition=`}
                        className='text-decoration-none'
                      >
                        <small style={{ color: '#666' }}>
                          <p style={{ margin: '0', color: '#666' }}>
                            <i class='fas fa-map-marker-alt me-2'></i>
                            {p.location.name}
                          </p>
                        </small>
                      </Link>
                      <small style={{ color: '#666' }}>
                        Seller:{' '}
                        <Link
                          to={`/user/${p.author._id}`}
                          className='text-decoration-none'
                          style={{ color: '#33b27b' }}
                        >
                          {p.author.name}
                        </Link>
                      </small>
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </Carousel>
    </div>
  );
};

export default RelatedProducts;
