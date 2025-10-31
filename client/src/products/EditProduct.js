import React, { useEffect, useState } from 'react';
import { isAuthenticated } from '../actions/auth';
import { message, Button, Tooltip, Popconfirm, Result } from 'antd';
import {
  singleProduct,
  updateProduct,
  deleteProductImage,
} from '../actions/product';
import { allLocations, allCategories } from '../actions/admin';
import { useHistory, Link } from 'react-router-dom';

const EditProduct = ({ match }) => {
  const [values, setValues] = useState({
    name: '',
    category: '',
    location: '',
    description: '',
    condition: '',
    price: '',
    author: '',
  });
  const [images, setImages] = useState([]);
  const [images2, setImages2] = useState([]);
  const [imageIds, setimageIds] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  const { user, token } = isAuthenticated();
  const { name, category, location, description, condition, price, author } =
    values;

  useEffect(() => {
    loadCategories();
    loadLocations();
    loadProduct();
  }, []);

  const loadCategories = async () => {
    let res = await allCategories();
    setCategories(res.data);
  };
  const loadLocations = async () => {
    let res = await allLocations();
    setLocations(res.data);
  };

  const loadProduct = async () => {
    const res = await singleProduct(match.params.productId);
    console.log(res);
    setValues({
      ...values,
      name: res.data.name,
      category: res.data.category._id,
      location: res.data.location._id,
      description: res.data.description,
      condition: res.data.condition,
      price: res.data.price,
      author: res.data.author._id,
    });
    setImages(res.data.images);
    setImages2(res.data.images);
    setimageIds(res.data.image_ids);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    let productData = new FormData();
    productData.append('name', name);
    productData.append('category', category);
    productData.append('location', location);
    productData.append('description', description);
    productData.append('condition', condition);
    productData.append('price', price);
    productData.append('author', author);
    productData.append('userAuth', user._id);
    for (let i = 0; i < images.length; i++) {
      images && productData.append('images', images[i]);
    }
    console.log(productData);

    try {
      const res = await updateProduct(
        match.params.productId,
        productData,
        token
      );
      console.log(res);
      message.success('Product updated successfully', 4);
      user.role === 'admin'
        ? history.push('/admin/dashboard')
        : history.push('/user/pending-products');
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) message.error(err.response.data, 4);
    }
  };

  const handleDelete = async (imageId, imageUrl) => {
    const imageIndex = images2.indexOf(imageUrl);

    try {
      if (imageIndex === -1) {
        const imageArray = images.filter((item) => item !== imageUrl);
        setImages(imageArray);
      } else {
        const res = await deleteProductImage(match.params.productId, {
          imageId,
          imageUrl,
          token,
        });
        console.log(res);
        window.location.reload();
      }
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) message.error(err.response.data, 4);
    }
  };

  const editProductForm = () => (
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
          <i class='fas fa-user-edit' style={{ marginRight: '10px' }}></i> Edit Product
        </h2>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <form onSubmit={handleSubmit} style={{
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
                      <div style={{ position: 'relative', margin: '5px' }} key={i}>
                        <img
                          src={image}
                          alt='preview_image'
                          style={{
                            height: '75px',
                            width: '75px',
                            borderRadius: '5px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Popconfirm
                          placement='top'
                          title={'Delete image?'}
                          onConfirm={() => handleDelete(imageIds[i], image)}
                          okText='Yes'
                          cancelText='No'
                        >
                          <span style={{
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            cursor: 'pointer'
                          }}>
                            <i
                              class='fas fa-times-circle text-danger'
                            ></i>
                          </span>
                        </Popconfirm>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h6 style={{ color: '#FFFFFF', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>Category*</h6>
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
              onChange={handleChange('category')}
              value={category}
            >
              <option disabled value={category._id}>
                {category.name}
              </option>
              {categories.map((c, i) => {
                return (
                  <option key={i} value={c._id}>
                    {c.name}
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
              <option disabled value={location._id}>
                {location.name}
              </option>
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
              Edit Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className='container-fluid profile-settings-container mt-5'>
        <div className='row'>
          {author !== user._id && (
            <Result
              status='403'
              title='403'
              subTitle='Sorry, you are not authorized to access this page.'
              extra={
                <Link to='/'>
                  <Button type='primary'>Back Home</Button>
                </Link>
              }
            />
          )}
          {author === user._id && (
            <div className='col-md-8 mx-auto mb-5'>{editProductForm()}</div>
          )}
        </div>
      </div>
    </>
  );
};

export default EditProduct;
