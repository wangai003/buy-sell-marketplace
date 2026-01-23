import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import 'antd/dist/antd.css';
import App from './App';
import { Provider } from 'react-redux';
import store from './redux/store';
import { queryClient } from './queryClient';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
