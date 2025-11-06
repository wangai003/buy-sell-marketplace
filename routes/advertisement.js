const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireSignin, adminMiddleware } = require('../middlewares');
const {
  getActiveAdvertisements,
  getAllAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  toggleAdvertisementStatus
} = require('../controllers/advertisement');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Public routes
router.get('/advertisement/active', getActiveAdvertisements);

// Admin routes
router.get('/admin/advertisements/all', requireSignin, adminMiddleware, getAllAdvertisements);
router.post('/admin/advertisements/create', requireSignin, adminMiddleware, upload.single('image'), createAdvertisement);
router.put('/admin/advertisements/update/:id', requireSignin, adminMiddleware, upload.single('image'), updateAdvertisement);
router.delete('/admin/advertisements/delete/:id', requireSignin, adminMiddleware, deleteAdvertisement);
router.put('/admin/advertisements/toggle/:id', requireSignin, adminMiddleware, toggleAdvertisementStatus);

module.exports = router;