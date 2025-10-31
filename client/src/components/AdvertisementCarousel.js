import React, { useState, useEffect } from 'react';
import { Carousel, message } from 'antd';
import axios from 'axios';

const AdvertisementCarousel = () => {
  const [advertisements, setAdvertisements] = useState([]);

  useEffect(() => {
    loadAdvertisements();
  }, []);

  const loadAdvertisements = async () => {
    try {
      const res = await axios.get('/api/advertisement/active');
      setAdvertisements(res.data);
    } catch (error) {
      console.error('Error loading advertisements:', error);
    }
  };

  const carouselSettings = {
    autoplay: true,
    autoplaySpeed: 4000,
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    pauseOnHover: true,
  };

  if (advertisements.length === 0) {
    return (
      <div className="advertisement-carousel-placeholder">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            height: '400px',
            backgroundColor: '#f8f9fa',
            border: '2px dashed #dee2e6',
            borderRadius: '8px',
            margin: '20px 0'
          }}
        >
          <div className="text-center">
            <i className="fas fa-ad fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">Advertise Here</h5>
            <p className="text-muted">Contact us to place your advertisement</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="advertisement-carousel mb-4">
      <Carousel {...carouselSettings}>
        {advertisements.map((ad, index) => (
          <div key={ad._id}>
            <div
              className="advertisement-slide"
              style={{
                position: 'relative',
                height: '400px',
                overflow: 'hidden',
                borderRadius: '8px'
              }}
            >
              {ad.link ? (
                <a
                  href={ad.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <img
                    src={ad.image}
                    alt={ad.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                  />
                </a>
              ) : (
                <img
                  src={ad.image}
                  alt={ad.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
              {ad.title && (
                <div
                  className="advertisement-overlay"
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '4px'
                  }}
                >
                  <h5 className="mb-0">{ad.title}</h5>
                </div>
              )}
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default AdvertisementCarousel;