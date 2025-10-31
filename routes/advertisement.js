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
router.get('/active', getActiveAdvertisements);

// Admin routes
router.get('/all', requireSignin, adminMiddleware, getAllAdvertisements);
router.post('/create', requireSignin, adminMiddleware, upload.single('image'), createAdvertisement);
router.put('/update/:id', requireSignin, adminMiddleware, upload.single('image'), updateAdvertisement);
router.delete('/delete/:id', requireSignin, adminMiddleware, deleteAdvertisement);
router.put('/toggle/:id', requireSignin, adminMiddleware, toggleAdvertisementStatus);

module.exports = router;