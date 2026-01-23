const express = require('express');
// const upload = require('../config/multer');
const upload = require('../config/multer2');
const router = express.Router();

// middlewares
const { requireSignin } = require('../middlewares');
//controllers
const {
  userProfile,
  userProfile2,
  reduxUser,
  updateProfile,
  updatePassword,
  followUser,
  unfollowUser,
  userProducts,
  userActiveProducts,
  userPendingProducts,
  userClosedProducts,
  favouriteProducts,
  submitSellerApplication,
  getStoresForYou,
  getConnectionsSubscriptionStatus,
  getSubscriptionTiers,
  getPotentialConnections,
  getConnectedBuyers,
  createConnection,
} = require('../controllers/user');
const {
  getUserNotifications,
  markNotificationsRead,
} = require('../controllers/notification');
const {
  setMsgToUnread,
  markMessageRead,
} = require('../controllers/chatMessages');

//routes
router.get('/user/:userId', userProfile);
router.get('/user2/:userId', userProfile2);
router.get('/redux-user/:userId', reduxUser);
router.get('/user/edit/:userId', userProfile);
router.get('/user/active-products/:userId', userActiveProducts);
router.get('/user/pending-products/:userId', userPendingProducts);
router.get('/user/closed-products/:userId', userClosedProducts);
router.get('/user/favourite-products/:userId', favouriteProducts);
router.put('/follow/:userId', requireSignin, followUser);
router.put('/unfollow/:userId', requireSignin, unfollowUser);
router.put(
  '/user/update/:userId',
  requireSignin,
  upload.single('photo'),
  updateProfile
);
router.put('/user/password/:userId', requireSignin, updatePassword);
router.get('/user/notifications/:userId', getUserNotifications);
router.post('/user/read-notifications', markNotificationsRead);
router.post('/user/unread-message', setMsgToUnread);
router.post('/user/read-message', markMessageRead);
router.post('/user/products/:userId', userProducts);
router.post('/user/become-seller/:userId', requireSignin, submitSellerApplication);
router.get('/for-you/stores/:userId', requireSignin, getStoresForYou);
router.get('/seller/subscription-status/:sellerId', requireSignin, getConnectionsSubscriptionStatus);
router.get('/seller/subscription-tiers', getSubscriptionTiers); // Public endpoint
router.get('/seller/potential-connections/:sellerId', requireSignin, getPotentialConnections);
router.get('/seller/connected-buyers/:sellerId', requireSignin, getConnectedBuyers);
router.post('/seller/create-connection', requireSignin, createConnection);

module.exports = router;
