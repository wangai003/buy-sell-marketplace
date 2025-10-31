import { createStore, combineReducers, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import { authReducer } from './reducers/auth';
import { userReducer } from './reducers/user';
import { productReducer } from './reducers/product';
import { currencyReducer } from './reducers/currency';

const middleware = [thunk];

const reducer = combineReducers({
  buynsellAuth: authReducer,
  buynsellUser: userReducer,
  buynsellProduct: productReducer,
  buynsellCurrency: currencyReducer,
});

const userState = window.localStorage.getItem('buynsell')
  ? JSON.parse(window.localStorage.getItem('buynsell'))
  : null;

const InitialState = {
  buynsellAuth: userState,
};

const store = createStore(
  reducer,
  InitialState,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;
