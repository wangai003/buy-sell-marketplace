const Order = require('../models/Order');

exports.getBuyerOrders = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const orders = await Order.find({ buyerId })
      .populate('productId sellerId')
      .sort({ createdAt: -1 })
      .exec();
    res.json(orders);
  } catch (err) {
    console.log('GET BUYER ORDERS FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const orders = await Order.find({ sellerId })
      .populate('productId buyerId')
      .sort({ createdAt: -1 })
      .exec();
    res.json(orders);
  } catch (err) {
    console.log('GET SELLER ORDERS FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ status: order.status, order });
  } catch (e) {
    res.status(500).json({ error: 'status error', detail: e.message });
  }
};