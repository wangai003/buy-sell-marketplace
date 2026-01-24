import axios from 'axios';

export const register = async (user) =>
  await axios.post(`${process.env.REACT_APP_API}/register`, user, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const login = async (user) => {
  console.log('Login request:', { api: process.env.REACT_APP_API, user: { email: user.email, password: '***' } });
  return await axios.post(`${process.env.REACT_APP_API}/login`, user, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const authenticate = (data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('buynsell', JSON.stringify(data));
  }
};

export const isAuthenticated = () => {
  if (typeof window == 'undefined') {
    return false;
  }
  if (localStorage.getItem('buynsell')) {
    return JSON.parse(localStorage.getItem('buynsell'));
  } else {
    return false;
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('buynsell');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.token;
    }
  }
  return null;
};
