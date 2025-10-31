import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated } from '../actions/auth';
import { message, Button, Result } from 'antd';
import { getUser, updateProfile, updateUser } from '../actions/user';
import { allLocations } from '../actions/admin';

const EditProfile = ({ match }) => {
  const [values, setValues] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    location: '',
    wallet: '',
    _id: '',
  });
  const [locations, setLocations] = useState([]);
  const [photo, setPhoto] = useState('');

  const { user, token } = isAuthenticated();
  const { name, username, email, phone, location, wallet, _id } = values;

  const loadUser = async () => {
    let data = await getUser(match.params.userId);
    console.log(data);
    //populate state
    setValues({
      ...values,
      name: data.data.name,
      username: data.data.username,
      email: data.data.email,
      phone: data.data.phone,
      location: data.data.location,
      wallet: data.data.wallet || '',
      _id: data.data._id,
    });
    setPhoto(data.data.photo);
  };

  useEffect(() => {
    loadUser();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    let res = await allLocations();
    setLocations(res.data);
  };

  const handleChange = (name) => (event) => {
    const value = event.target.value;
    setValues({ ...values, [name]: value });
    console.log(value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      URL.createObjectURL(file);
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        var base64data = reader.result;
        setPhoto(base64data);
        URL.revokeObjectURL(file);
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let userData = new FormData();
    userData.append('name', name);
    userData.append('username', username);
    userData.append('email', email);
    userData.append('phone', phone);
    userData.append('location', location);
    userData.append('wallet', wallet);
    userData.append('_id', user._id);
    photo && userData.append('photo', photo);

    try {
      const res = await updateProfile(match.params.userId, userData, token);
      //update localStorage
      updateUser(res.data);
      console.log(res.data);
      setTimeout(function () {
        window.location.reload();
      }, 1000);
      message.success('Profile updated successfully', 4);
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) message.error(err.response.data, 4);
    }
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
    },
    input: {
      backgroundColor: 'white',
      border: '1px solid #FFD700',
      borderRadius: '0',
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

  const updateProfileForm = () => (
    <div className='card rounded-0 pb-5 card-shadow' style={styles.card}>
      <div className='card-header p-4' style={{...styles.card, borderBottom: '1px solid #FFD700'}}>
        <h2 className='text-center' style={styles.text}>
          <i class='fas fa-user-edit'></i> Edit your profile
        </h2>
      </div>
      <div className='card-body'>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div className='form-group mb-4 col-md-8' style={{width: '100%', maxWidth: '500px'}}>
            <label className='form-label' style={styles.text}>Your name</label>
            <input
              type='text'
              className='form-control shadow-none'
              placeholder='Enter name'
              value={name}
              onChange={handleChange('name')}
              style={styles.input}
            />
          </div>
          <div className='form-group mb-4 col-md-8' style={{width: '100%', maxWidth: '500px'}}>
            <label className='form-label' style={styles.text}>Your username</label>
            <input
              type='text'
              className='form-control shadow-none'
              placeholder='Enter username'
              value={username}
              onChange={handleChange('username')}
              style={styles.input}
            />
          </div>
          <div className='form-group mb-4 col-md-8' style={{width: '100%', maxWidth: '500px'}}>
            <select
              class='form-select shadow-none'
              aria-label='Default select example'
              onChange={handleChange('location')}
              value={location}
              style={styles.input}
            >
              <option selected>Your Location</option>
              {locations.map((l, i) => {
                return <option key={i}>{l.name}</option>;
              })}
            </select>
          </div>

          <div className='col-md-8' style={{width: '100%', maxWidth: '500px'}}>
            <h6 style={styles.text}>Upload Photo</h6>
            <div className='form-group mb-3 d-flex'>
              <label
                className='btn btn-secondary p-0 me-3'
                style={{ fontSize: '10px', ...styles.button }}
              >
                <div>
                  <i class='fas fa-plus fa-2x p-4'></i>
                </div>
                <input
                  onChange={handleImageChange}
                  type='file'
                  name='images'
                  accept='image/*'
                  multiple
                  hidden
                />
              </label>
              {photo && (
                <img
                  src={photo}
                  alt={user.username}
                  style={{ height: '70px', width: '70px' }}
                />
              )}
            </div>
          </div>
          <div className='form-group mb-4 col-md-8' style={{width: '100%', maxWidth: '500px'}}>
            <label className='form-label' style={styles.text}>Email address</label>
            <input
              type='email'
              className='form-control shadow-none'
              placeholder='Enter email'
              value={email}
              onChange={handleChange('email')}
              style={styles.input}
            />
          </div>
          <div className='form-group mb-4 col-md-8' style={{width: '100%', maxWidth: '500px'}}>
            <label className='form-label' style={styles.text}>Phone number</label>
            <input
              type='tel'
              className='form-control shadow-none'
              placeholder='Enter phone number'
              value={phone}
              onChange={handleChange('phone')}
              style={styles.input}
            />
          </div>
          <div className='form-group mb-4 col-md-8' style={{width: '100%', maxWidth: '500px'}}>
            <label className='form-label' style={styles.text}>Wallet Address</label>
            <input
              type='text'
              className='form-control shadow-none'
              placeholder='Enter wallet address'
              value={wallet}
              onChange={handleChange('wallet')}
              style={styles.input}
            />
          </div>

          <div className='col-md-8' style={{width: '100%', maxWidth: '500px'}}>
            <Button
              type='primary'
              size='large'
              shape='round'
              className='rounded-0'
              htmlType='submit'
              style={styles.button}
            >
              Edit Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const updateProfileBar = () => (
    <div className='card rounded-0 card-shadow'>
      <div className='card-header p-2 pt-3'>
        <h4 className='ms-3'>
          <Link
            to='/user/dashboard'
            className='text-decoration-none text-dark1 text-dark-hover'
          >
            <i class='fas fa-arrow-circle-left'></i> Dashboard
          </Link>
        </h4>
      </div>
      <div className='card-body'>
        <ul className='list-group rounded-0 profile-list'>
          <li className='list-group-item'>
            <Link
              to={`/user/edit/${user._id}`}
              className='text-decoration-none text-dark1 text-dark-hover'
            >
              Edit Profile
            </Link>
          </li>
          <li className='list-group-item'>
            <Link
              to={`/user/password/${user._id}`}
              className='text-decoration-none text-dark1 text-dark-hover'
            >
              Change Password
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <div className='container-fluid profile-settings-container mt-5' style={styles.container}>
        <div className='row'>
          {_id !== user._id && (
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
          {_id === user._id && (
            <>
              {' '}
              <div className='col-md-4 mb-5'>{updateProfileBar()}</div>
              <div className='col-md-8 mb-5'>{updateProfileForm()}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default EditProfile;
