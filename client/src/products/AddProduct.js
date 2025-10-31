import React, { useEffect, useState } from 'react';
import { isAuthenticated } from '../actions/auth';
import { message, Button, Tooltip, Form } from 'antd';
import { addProduct } from '../actions/product';
import { allLocations } from '../actions/admin';
import { useHistory, Link } from 'react-router-dom';
import HierarchicalSelector from '../components/HierarchicalSelector';

const AddProduct = ({ match }) => {
  const [values, setValues] = useState({
    name: '',
    category: '',
    subcategory: '',
    element: '',
    location: '',
    description: '',
    condition: '',
    price: '',
  });
  const [images, setImages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({
    category: '',
    subcategory: '',
    element: '',
    categoryName: ''
  });
  const [isAuction, setIsAuction] = useState(false);
  const [startingBid, setStartingBid] = useState('');
  const [duration, setDuration] = useState('');

  const { token } = isAuthenticated();
  const { name, category, subcategory, element, location, description, condition, price } = values;

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    // Update values when selectedCategories changes
    setValues(prevValues => ({
      ...prevValues,
      category: selectedCategories.category,
      subcategory: selectedCategories.subcategory,
      element: selectedCategories.element
    }));

    // Set isAuction based on category name
    setIsAuction(selectedCategories.categoryName === 'Live Bidding Hub');
  }, [selectedCategories]);

  const loadLocations = async () => {
    let res = await allLocations();
    setLocations(res.data);
  };

  const handleChange = (name) => (e) => {
    setValues({ ...values, [name]: e.target.value });
  };
  const handleImageChange = (e) => {
    //get multiple images & convert to base64 fro cloudinary
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        URL.createObjectURL(file);
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          var base64data = reader.result;
          setImages((prevImages) => prevImages.concat(base64data));
          // console.log(base64data);
          Array.from(e.target.files).map((file) => URL.revokeObjectURL(file));
        };
      });
    }
  };

  const history = useHistory();

  const handleSubmit = async (formValues) => {
    // Validation for auction fields
    if (isAuction) {
      if (!startingBid || startingBid <= 0) {
        message.error('Starting bid is required and must be greater than 0 for auctions', 4);
        return;
      }
      if (!duration || duration <= 0) {
        message.error('Duration is required and must be greater than 0 hours for auctions', 4);
        return;
      }
    }

    let productData = new FormData();
    productData.append('name', formValues.name || name);
    productData.append('category', formValues.category || category);
    productData.append('subcategory', formValues.subcategory || subcategory);
    productData.append('element', formValues.element || element);
    productData.append('location', formValues.location || location);
    productData.append('description', formValues.description || description);
    productData.append('condition', formValues.condition || condition);
    productData.append('price', formValues.price || price);
    productData.append('isAuction', isAuction);
    if (isAuction) {
      productData.append('startingBid', startingBid);
      productData.append('duration', duration);
    }
    for (let i = 0; i < images.length; i++) {
      images && productData.append('images', images[i]);
    }

    console.log('Submitting product data:', {
      name: formValues.name || name,
      category: formValues.category || category,
      isAuction,
      startingBid,
      duration,
      imagesCount: images.length
    });

    try {
      const res = await addProduct(match.params.userId, productData, token);
      console.log(res);
      message.success('Product added successfully', 4);
      history.push('/user/pending-products');
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 400) message.error(err.response.data, 4);
    }
  };

  const addProductForm = () => (
    <div style={{
      background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      padding: '20px',
      margin: '20px 0',
      transition: 'transform 0.3s ease',
      ':hover': {
        transform: 'translateY(-5px)'
      }
    }}>
      <div style={{
        padding: '20px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#FFFFFF',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
        }}>
          <Link
            to='/user/dashboard'
            style={{ color: '#FFFFFF', textDecoration: 'none' }}
          >
            <Tooltip title='Back to Dashboard'>
              <span style={{ marginRight: '10px' }}>
                <i class='fas fa-arrow-circle-left'></i>
              </span>
            </Tooltip>
          </Link>
          <i class='fas fa-user-edit' style={{ marginRight: '10px' }}></i> Post a Product
        </h2>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <Form onFinish={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <label style={{
              marginBottom: '5px',
              color: '#333',
              fontWeight: 'bold'
            }}>Product Name*</label>
            <input
              type='text'
              style={{
                padding: '10px',
                border: '2px solid #FFD700',
                borderRadius: '5px',
                background: '#FFFFFF',
                color: '#333',
                transition: 'border-color 0.3s ease',
                ':focus': {
                  outline: 'none',
                  borderColor: '#33b27b'
                }
              }}
              placeholder='Enter product name'
              value={name}
              onChange={handleChange('name')}
            />
          </div>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h6 style={{ color: '#FFFFFF', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Upload Images*</h6>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div>
                <label
                  style={{
                    borderRadius: '50%',
                    background: '#33b27b',
                    color: '#FFFFFF',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                    ':hover': {
                      background: '#28a745'
                    }
                  }}
                >
                  <i class='fas fa-plus fa-1x'></i>
                  <input
                    onChange={handleImageChange}
                    type='file'
                    name='images'
                    accept='image/*'
                    multiple
                    hidden
                  />
                </label>
              </div>
              {images && images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {images.map((image, i) => {
                    return (
                      <img
                        key={i}
                        src={image}
                        alt='preview_image'
                        style={{
                          height: '75px',
                          width: '75px',
                          margin: '5px',
                          borderRadius: '5px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <HierarchicalSelector
              onSelectionChange={setSelectedCategories}
              initialValue={[category, subcategory, element].filter(Boolean)}
            />
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h6 style={{ color: '#FFFFFF', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Location*</h6>
            <select
              style={{
                padding: '10px',
                border: '2px solid #FFD700',
                borderRadius: '5px',
                background: '#FFFFFF',
                color: '#333',
                transition: 'border-color 0.3s ease',
                ':focus': {
                  outline: 'none',
                  borderColor: '#33b27b'
                }
              }}
              onChange={handleChange('location')}
              value={location}
            >
              <option>Select location</option>
              {locations.map((l, i) => {
                return (
                  <option key={i} value={l._id}>
                    {l.name}
                  </option>
                );
              })}
            </select>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <label style={{
              marginBottom: '5px',
              color: '#333',
              fontWeight: 'bold'
            }}>Description*</label>
            <textarea
              style={{
                padding: '10px',
                border: '2px solid #FFD700',
                borderRadius: '5px',
                background: '#FFFFFF',
                color: '#333',
                height: '100px',
                transition: 'border-color 0.3s ease',
                ':focus': {
                  outline: 'none',
                  borderColor: '#33b27b'
                }
              }}
              placeholder='Enter detailed description of product'
              value={description}
              onChange={handleChange('description')}
            />
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h6 style={{ color: '#FFFFFF', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Condition</h6>
            <select
              style={{
                padding: '10px',
                border: '2px solid #FFD700',
                borderRadius: '5px',
                background: '#FFFFFF',
                color: '#333',
                transition: 'border-color 0.3s ease',
                ':focus': {
                  outline: 'none',
                  borderColor: '#33b27b'
                }
              }}
              onChange={handleChange('condition')}
              value={condition}
            >
              <option value=''>Select condition</option>
              <option key={1} value=''>
                Not applicable
              </option>
              <option key={2}>New</option>
              <option key={3}>Used</option>
            </select>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <label style={{
              marginBottom: '5px',
              color: '#333',
              fontWeight: 'bold'
            }}>Price*</label>
            <div style={{ display: 'flex' }}>
              <span
                style={{
                  padding: '10px',
                  background: '#FFD700',
                  color: '#FFFFFF',
                  borderRadius: '5px 0 0 5px',
                  border: '2px solid #FFD700'
                }}
              >
                USDC
              </span>
              <input
                type='number'
                style={{
                  padding: '10px',
                  border: '2px solid #FFD700',
                  borderLeft: 'none',
                  borderRadius: '0 5px 5px 0',
                  background: '#FFFFFF',
                  color: '#333',
                  flex: 1,
                  transition: 'border-color 0.3s ease',
                  ':focus': {
                    outline: 'none',
                    borderColor: '#33b27b'
                  }
                }}
                placeholder='Enter price'
                value={price}
                onChange={handleChange('price')}
              />
            </div>
          </div>

          {isAuction && (
            <>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                <label style={{
                  marginBottom: '5px',
                  color: '#333',
                  fontWeight: 'bold'
                }}>Starting Bid*</label>
                <div style={{ display: 'flex' }}>
                  <span style={{
                    padding: '10px',
                    background: '#FFD700',
                    color: '#FFFFFF',
                    borderRadius: '5px 0 0 5px',
                    border: '2px solid #FFD700'
                  }}>
                    USDC
                  </span>
                  <input
                    type='number'
                    style={{
                      padding: '10px',
                      border: '2px solid #FFD700',
                      borderLeft: 'none',
                      borderRadius: '0 5px 5px 0',
                      background: '#FFFFFF',
                      color: '#333',
                      flex: 1,
                      transition: 'border-color 0.3s ease',
                      ':focus': {
                        outline: 'none',
                        borderColor: '#33b27b'
                      }
                    }}
                    placeholder='Enter starting bid'
                    value={startingBid}
                    onChange={(e) => setStartingBid(e.target.value)}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                <label style={{
                  marginBottom: '5px',
                  color: '#333',
                  fontWeight: 'bold'
                }}>Duration (hours)*</label>
                <input
                  type='number'
                  style={{
                    padding: '10px',
                    border: '2px solid #FFD700',
                    borderRadius: '5px',
                    background: '#FFFFFF',
                    color: '#333',
                    transition: 'border-color 0.3s ease',
                    ':focus': {
                      outline: 'none',
                      borderColor: '#33b27b'
                    }
                  }}
                  placeholder='Enter duration in hours'
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <Button
              type='primary'
              size='large'
              style={{
                background: 'linear-gradient(to right, #33b27b, #28a745)',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '20px',
                padding: '10px 30px',
                transition: 'all 0.3s ease',
                ':hover': {
                  transform: 'scale(1.05)'
                }
              }}
              htmlType='submit'
            >
              Post Product
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );

  return (
    <>
      <div className='container-fluid profile-settings-container mt-5'>
        <div className='row'>
          <div className='col-md-8 mx-auto mb-5'>{addProductForm()}</div>
        </div>
      </div>
    </>
  );
};

export default AddProduct;
