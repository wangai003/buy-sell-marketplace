import axios from 'axios';

export const createPayment = async (productId, buyerId, sellerId, amountUSD, quantity = 1) =>
  await axios.post(`${process.env.REACT_APP_API}/payment/create`, {
    productId,
    buyerId,
    sellerId,
    amountUSD,
    quantity,
  });

export const getBuyerOrders = async (buyerId) =>
  await axios.get(`${process.env.REACT_APP_API}/orders/buyer/${buyerId}`);

export const getSellerOrders = async (sellerId) =>
  await axios.get(`${process.env.REACT_APP_API}/orders/seller/${sellerId}`);

export const updateOrderStatus = async (orderId, newStatus, trackingNumber, deliveryProvider, estimatedDeliveryDate) =>
  await axios.put(`${process.env.REACT_APP_API}/payment/status`, {
    orderId,
    newStatus,
    trackingNumber,
    deliveryProvider,
    estimatedDeliveryDate,
  });

export const getAllOrders = async () =>
  await axios.get(`${process.env.REACT_APP_API}/admin/orders`);

export const paySeller = async (orderId, token) =>
  await axios.post(
    `${process.env.REACT_APP_API}/admin/pay-seller`,
    { orderId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );