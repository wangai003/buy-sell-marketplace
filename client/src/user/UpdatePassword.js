import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated } from '../actions/auth';
import { message, Button, Result } from 'antd';
import { getUser } from '../actions/user';
import { updatePassword } from '../actions/user';

const UpdatePassword = ({ match }) => {
  const [values, setValues] = useState({
    oldPassword: '',
    password: '',
    newPasswordConfirm: '',
    userId: '',
    userAuth: '',
  });

  const { oldPassword, password, newPasswordConfirm, userId } = values;
  const { user, token } = isAuthenticated();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    let res = await getUser(match.params.userId);
    setValues({ ...values, userId: res.data._id, userAuth: user._id });
  };

  const handleChange = (name) => (event) => {
    const value = event.target.value;
    setValues({ ...values, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(values);

    try {
      const res = await updatePassword(
        match.params.userId,
        JSON.stringify(values),
        token
      );
      console.log(res);
      //   window.location.reload();
      setValues({
        ...values,
        password: '',
        oldPassword: '',
        newPasswordConfirm: '',
      });
      message.success('Password updated successfully', 4);
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) message.error(err.response.data, 4);
    }
  };


  const updatePasswordForm = () => (
    <div className='card rounded-0 pb-5 card-shadow' style={styles.card}>
      <div className='card-header p-4' style={{...styles.card, borderBottom: '1px solid #FFD700'}}>
        <h2 className='text-center' style={styles.title}>
          <i class='fas fa-user-edit'></i> Update your password
        </h2>
      </div>
      <div className='card-body'>
        <form onSubmit={handleSubmit}>
          <div className='form-group mb-4 col-md-8 mx-auto'>
            <label className='form-label' style={styles.text}>Old Password</label>
            <input
              type='password'
              className='form-control shadow-none rounded-0'
              placeholder='Enter old password'
              value={oldPassword}
              onChange={handleChange('oldPassword')}
              style={styles.input}
            />
          </div>
          <div className='form-group mb-4 col-md-8 mx-auto'>
            <label className='form-label' style={styles.text}>New Password</label>
            <input
              type='password'
              className='form-control shadow-none rounded-0'
              placeholder='Enter new password'
              value={password}
              onChange={handleChange('password')}
              style={styles.input}
            />
          </div>
          <div className='form-group mb-4 col-md-8 mx-auto'>
            <label className='form-label' style={styles.text}>Confirm New Password</label>
            <input
              type='password'
              className='form-control shadow-none rounded-0'
              placeholder='Re-type new password'
              value={newPasswordConfirm}
              onChange={handleChange('newPasswordConfirm')}
              style={styles.input}
            />
          </div>
          <div className='mx-auto col-md-8'>
            <Button
              type='primary'
              size='large'
              shape='round'
              className='rounded-0'
              htmlType='submit'
              style={styles.button}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const updatePasswordBar = () => (
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
    input: {
      border: '1px solid #FFD700',
      borderRadius: '4px',
      padding: '10px',
      width: '100%',
      transition: 'all 0.3s ease',
    },
    inputFocus: {
      borderColor: '#228B22',
      boxShadow: '0 0 5px rgba(34, 139, 34, 0.5)',
    },
  };

  return (
    <>
      <div className='container-fluid profile-settings-container mt-5' style={styles.container}>
        <div className='row'>
          {userId !== user._id && (
            <Result
              status='403'
              title='403'
              subTitle='Sorry, you are not authorized to access this page.'
              extra={
                <Link to='/'>
                  <Button type='primary' style={styles.button}>Back Home</Button>
                </Link>
              }
            />
          )}
          {userId === user._id && (
            <>
              {' '}
              <div className='col-md-4 mx-auto mb-5'>{updatePasswordBar()}</div>
              <div className='col-md-8 mx-auto mb-5'>
                {updatePasswordForm()}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdatePassword;
