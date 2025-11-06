const Order = require('../models/Order');
const mongoose = require('mongoose');

exports.getBuyerOrders = async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    // Validate buyerId format
    if (!buyerId || !mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({ error: 'Invalid buyer ID' });
    }
    
    // ✅ SECURITY CHECK: Validate buyerId matches authenticated user
    if (req.user && req.user._id.toString() !== buyerId) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own orders' });
    }
    
    const orders = await Order.find({ buyerId })
      .populate({
        path: 'productId',
        select: 'name images price isAuction',
        model: 'Product'
      })
      .populate({
        path: 'sellerId',
        select: 'name username email businessName',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    // Handle null references gracefully
    const sanitizedOrders = orders.map(order => ({
      ...order,
      productId: order.productId || null,
      sellerId: order.sellerId || null
    }));
    
    res.json(sanitizedOrders);
  } catch (err) {
    console.log('GET BUYER ORDERS FAILED', err);
    console.error('Error details:', err.stack);
    return res.status(500).json({ error: 'Error fetching buyer orders', details: err.message });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Validate sellerId format
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ error: 'Invalid seller ID' });
    }
    
    // ✅ SECURITY CHECK: Validate sellerId matches authenticated user
    if (req.user && req.user._id.toString() !== sellerId) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own seller orders' });
    }
    
    const orders = await Order.find({ sellerId })
      .populate({
        path: 'productId',
        select: 'name images price isAuction',
        model: 'Product'
      })
      .populate({
        path: 'buyerId',
        select: 'name username email',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    // Handle null references gracefully
    const sanitizedOrders = orders.map(order => ({
      ...order,
      productId: order.productId || null,
      buyerId: order.buyerId || null
    }));
    
    res.json(sanitizedOrders);
  } catch (err) {
    console.log('GET SELLER ORDERS FAILED', err);
    console.error('Error details:', err.stack);
    return res.status(500).json({ error: 'Error fetching seller orders', details: err.message });
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