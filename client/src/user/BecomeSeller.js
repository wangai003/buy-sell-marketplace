import React, { useState, useEffect } from 'react';
import { isAuthenticated } from '../actions/auth';
import { message, Button, Form, Input, Card } from 'antd';
import { useHistory, Link } from 'react-router-dom';
import { submitSellerApplication } from '../actions/user';
import { updateUser } from '../actions/user';
import MultiHierarchicalSelector from '../components/MultiHierarchicalSelector';

const BecomeSeller = ({ match }) => {
  const [form] = Form.useForm();
  const { user, token } = isAuthenticated();
  const history = useHistory();
  
  const [businessLogo, setBusinessLogo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [socialMediaLinks, setSocialMediaLinks] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    website: '',
  });

  useEffect(() => {
    // Redirect if already a seller
    if (user && user.canSell) {
      message.info('You already have seller privileges');
      history.push('/user/dashboard');
    }
  }, [user]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      URL.createObjectURL(file);
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        var base64data = reader.result;
        setBusinessLogo(base64data);
        URL.revokeObjectURL(file);
      };
    }
  };

  const handleCategoryChange = (categoryIds) => {
    // categoryIds is an array of element IDs (final level in hierarchy)
    setSelectedCategories(categoryIds);
  };

  const handleSocialMediaChange = (platform, value) => {
    setSocialMediaLinks({
      ...socialMediaLinks,
      [platform]: value,
    });
  };

  const handleSubmit = async (values) => {
    try {
      // Validate at least one social media link
      const hasSocialLink = Object.values(socialMediaLinks).some(link => link.trim() !== '');
      if (!hasSocialLink) {
        message.error('Please provide at least one social media link');
        return;
      }

      // Validate at least one category selected
      if (selectedCategories.length === 0) {
        message.error('Please select at least one category');
        return;
      }

      // Filter out empty social media links
      const filteredSocialLinks = {};
      Object.keys(socialMediaLinks).forEach(key => {
        if (socialMediaLinks[key].trim() !== '') {
          filteredSocialLinks[key] = socialMediaLinks[key].trim();
        }
      });

      const formData = {
        businessName: values.businessName,
        businessPhone: values.businessPhone,
        businessLogo: businessLogo,
        socialMediaLinks: filteredSocialLinks,
        sellerCategories: selectedCategories,
        _id: user._id,
      };

      const res = await submitSellerApplication(match.params.userId, formData, token);
      message.success('Seller application submitted successfully! You now have seller privileges.', 6);
      
      // Update local storage with new user data
      const updatedUserData = {
        ...user,
        canSell: true,
        businessName: values.businessName,
        businessPhone: values.businessPhone,
        businessLogo: res.data.user.businessLogo,
        socialMediaLinks: filteredSocialLinks,
        sellerCategories: selectedCategories,
      };
      updateUser(updatedUserData);
      
      // Reload page to update user state
      setTimeout(() => {
        window.location.href = '/user/dashboard';
      }, 2000);
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 400) {
        message.error(err.response.data, 6);
      } else {
        message.error('Error submitting application. Please try again.', 4);
      }
    }
  };

  return (
    <div className='container-fluid profile-settings-container mt-5'>
      <div className='row'>
        <div className='col-md-10 col-lg-8 col-sm-11 mx-auto'>
          <Card
            style={{
              background: 'linear-gradient(to bottom, #FFD700, #FFFFFF)',
              borderRadius: '10px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ color: '#333', marginBottom: '10px' }}>
                <Link to='/user/dashboard' style={{ color: '#333', marginRight: '15px' }}>
                  <i className='fas fa-arrow-circle-left'></i>
                </Link>
                Become a Seller
              </h2>
              <p style={{ color: '#666' }}>
                Complete your business profile to start selling on our platform
              </p>
            </div>

            <Form
              form={form}
              onFinish={handleSubmit}
              layout='vertical'
              style={{ background: 'rgba(255,255,255,0.9)', padding: '30px', borderRadius: '10px' }}
            >
              <Form.Item
                label={<strong>Business Name *</strong>}
                name='businessName'
                rules={[{ required: true, message: 'Please enter your business name' }]}
              >
                <Input size='large' placeholder='Enter your business name' />
              </Form.Item>

              <Form.Item
                label={<strong>Business Logo *</strong>}
                required
              >
                <div>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleLogoChange}
                    style={{ marginBottom: '10px' }}
                  />
                  {businessLogo && (
                    <div style={{ marginTop: '10px' }}>
                      <img
                        src={businessLogo}
                        alt='Business logo preview'
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          border: '2px solid #FFD700',
                        }}
                      />
                    </div>
                  )}
                </div>
              </Form.Item>

              <Form.Item
                label={<strong>Business Phone Number *</strong>}
                name='businessPhone'
                rules={[
                  { required: true, message: 'Please enter your business phone number' },
                  { pattern: /^\d{11}$/, message: 'Phone number must be 11 digits' },
                ]}
              >
                <Input size='large' placeholder='Enter 11-digit phone number' />
              </Form.Item>

              <Form.Item
                label={<strong>Categories You'll Deal With *</strong>}
                required
                rules={[{ required: true, message: 'Please select at least one category' }]}
              >
                <MultiHierarchicalSelector
                  onSelectionChange={handleCategoryChange}
                  selectedCategories={selectedCategories}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
                  * Select categories, subcategories, and elements you'll be selling in. You can select multiple items.
                </small>
              </Form.Item>

              <Form.Item
                label={<strong>Social Media Links *</strong>}
                required
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Input
                    placeholder='Facebook URL (optional)'
                    value={socialMediaLinks.facebook}
                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                    prefix={<i className='fab fa-facebook' style={{ color: '#1877F2' }}></i>}
                  />
                  <Input
                    placeholder='Instagram URL (optional)'
                    value={socialMediaLinks.instagram}
                    onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                    prefix={<i className='fab fa-instagram' style={{ color: '#E4405F' }}></i>}
                  />
                  <Input
                    placeholder='Twitter URL (optional)'
                    value={socialMediaLinks.twitter}
                    onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                    prefix={<i className='fab fa-twitter' style={{ color: '#1DA1F2' }}></i>}
                  />
                  <Input
                    placeholder='LinkedIn URL (optional)'
                    value={socialMediaLinks.linkedin}
                    onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                    prefix={<i className='fab fa-linkedin' style={{ color: '#0077B5' }}></i>}
                  />
                  <Input
                    placeholder='Website URL (optional)'
                    value={socialMediaLinks.website}
                    onChange={(e) => handleSocialMediaChange('website', e.target.value)}
                    prefix={<i className='fas fa-globe' style={{ color: '#333' }}></i>}
                  />
                </div>
                <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
                  * At least one social media link is required
                </small>
              </Form.Item>

              <Form.Item>
                <Button
                  type='primary'
                  htmlType='submit'
                  size='large'
                  block
                  style={{
                    background: 'linear-gradient(to right, #33b27b, #28a745)',
                    border: 'none',
                    borderRadius: '20px',
                    height: '50px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  Submit Application
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;
