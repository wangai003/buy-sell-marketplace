import { Route, Redirect } from 'react-router-dom';
import { isAuthenticated } from '../actions/auth';
import { message } from 'antd';

const SellerRoute = ({ ...rest }) => {
  const authData = isAuthenticated();
  const user = authData?.user;
  const token = authData?.token;

  // Check if user is authenticated
  if (!user || !token) {
    return <Redirect to='/login' />;
  }

  // Check if user has seller permission
  if (!user.canSell) {
    message.error('You do not have permission to access seller features. Please contact an administrator to request seller privileges.', 6);
    return <Redirect to='/user/dashboard' />;
  }

  return <Route {...rest} />;
};

export default SellerRoute;
