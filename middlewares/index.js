const expressJwt = require('express-jwt');
const User = require('../models/User');

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
});

exports.adminMiddleware = async (req, res, next) => {
  try {
    // If role is not in token (old token), fetch it from database
    if (!req.user.role) {
      const user = await User.findById(req.user._id).select('role').exec();
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user.role = user.role;
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    console.log('ADMIN MIDDLEWARE ERROR', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
