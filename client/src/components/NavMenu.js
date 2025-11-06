import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Badge } from 'antd';
import io from 'socket.io-client';
import { useHistory } from 'react-router';
import { isAuthenticated } from '../actions/auth';
import {
  reduxUser,
  getUser,
  getUserNotifications,
  setMsgToUnread,
} from '../actions/user';
import { useDispatch, useSelector } from 'react-redux';
import CurrencySelector from './CurrencySelector';
// import NProgress from 'nprogress';

const NavMenu = () => {
  const userInfo = useSelector((state) => state.buynsellUser);
  const dispatch = useDispatch();

  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(null);
  const { user, token } = isAuthenticated();
  const history = useHistory();
  const socket = useRef();
  // let location = useLocation();

  // useEffect(() => {
  //   NProgress.start();

  //   setTimeout(() => {
  //     NProgress.done();
  //   }, 500);
  // }, [location]);

  const loadUser = async () => {
    if (user) {
      let res = await reduxUser(user._id);
      let userNotifications = await getUserNotifications(user._id);
      dispatch({
        type: 'USER_DETAILS',
        payload: res.data,
      });
      setNotifications(userNotifications.data.notifications);
      setNotificationCount(userNotifications.data.currentNotificationCount);
    }
  };

  useEffect(() => {
    loadUser();
  }, [dispatch]);

  //Socket useEffect
  useEffect(() => {
    if (user) {
      if (!socket.current) {
        socket.current = io('http://localhost:8000', {
          transports: ['websocket'],
        });
      }

      if (socket.current) {
        socket.current.emit('join', { userId: user._id });

        socket.current.on('newMsgReceived', async ({ newMsg }) => {
          if (window.location.pathname !== '/messages') {
            const res = await setMsgToUnread({
              userId: newMsg.receiver,
            });
          }
          let res = await getUser(newMsg.receiver);
          dispatch({
            type: 'USER_DETAILS',
            payload: res.data,
          });
        });
      }
    }
  }, []);

  const logout = () => {
    window.localStorage.removeItem('buynsell');
    history.push('/login');
    window.location.reload();
  };

  const handleSell = () => {
    if (isAuthenticated() && user && user.canSell) {
      history.push(`/add-product/${user._id}`);
    } else {
      history.push('/login');
    }
  };

  return (
    <div className='container-fluid p-0'>
      <div className='navmenu navbar navbar-expand-sm navbar-dark px-sm-5 container-fluid nav-shadow'>
        <Link className='navbar-brand' to='/'>
          <img
            src="https://files.catbox.moe/r7gvct.png"
            alt="Logo"
            style={{ height: '40px', width: 'auto' }}
          />
        </Link>
        <ul className='navbar-nav align-items-center ms-auto'>
          {user && token && (
            <li className='nav-item ml-5 px-2'>
              <Link className='nav-link' to='/for-you' style={{ color: '#333', fontWeight: '500' }}>
                <i className='fas fa-heart me-1'></i>For You
              </Link>
            </li>
          )}
           {user && user.canSell && (
             <li className='nav-item ml-5 px-2'>
               <Button
                 type='primary'
                 danger
                 size='large'
                 shape='round'
                 onClick={handleSell}
                 className='sellButton ml-5'
               >
                 Sell a Product
               </Button>
             </li>
           )}
           <li className='nav-item ml-5 px-2'>
             <CurrencySelector />
           </li>
          {user && token && (
            <>
              <div class='nav-item ml-5 px-2 dropdown'>
                <Badge
                  dot={userInfo.unreadNotification || userInfo.unreadMessage}
                >
                  <Avatar
                    src={user.photo}
                    size={40}
                    style={{
                      borderRadius: 'none',
                    }}
                    shape='square'
                    class='nav-link dropdown-toggle nav-avatar'
                    to='/dashboard'
                    role='button'
                    id='navbarDropdown'
                    data-toggle='dropdown'
                    aria-haspopup='true'
                    aria-expanded='false'
                  >
                    {user.username[0]}
                  </Avatar>
                </Badge>
                <ul className='dropdown-menu' aria-labelledby='navbarDropdown'>
                  <Link className='nav-link' to='/user/dashboard' style={{ color: '#333' }}>
                    Dashboard
                  </Link>
                  {user.role === 'admin' && (
                    <Link className='nav-link' to='/admin/dashboard' style={{ color: '#333' }}>
                      Admin
                    </Link>
                  )}
                  <Link
                    className='nav-link d-flex align-items-center'
                    to='/user/notifications'
                    style={{ color: '#333' }}
                  >
                    <div>Notifications </div>
                    {notifications.length - notificationCount > 0 && (
                      <div>
                        <span class='badge rounded-pill bg-danger ms-2 notification-badge'>
                          {notifications.length === 0 ||
                          !userInfo.unreadNotification
                            ? ''
                            : notifications.length - notificationCount}
                        </span>
                      </div>
                    )}
                  </Link>
                  <Link className='nav-link' to='/messages' style={{ color: '#333' }}>
                    <div className='d-flex align-items-center'>
                      <div className='pe-1'>Messages</div>
                      <div>
                        {userInfo.unreadMessage && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              backgroundColor: 'red',
                              borderRadius: '50%',
                              marginLeft: '5px',
                            }}
                          ></span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <span className='nav-link' role='button' onClick={logout} style={{ color: '#333', cursor: 'pointer' }}>
                    Logout
                  </span>
                </ul>
              </div>
            </>
          )}
          {!user && !token && (
            <>
              <li className='nav-item ml-5 px-2'>
                <Link className='nav-link' to='/login' style={{ color: '#333', fontWeight: '500' }}>
                  Login
                </Link>
              </li>
              <li className='nav-item ml-5 px-2'>
                <Link className='nav-link' to='/register' style={{ color: '#333', fontWeight: '500' }}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default NavMenu;
