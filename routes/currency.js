const express = require('express');
const router = express.Router();
const { getRates, convertPrice } = require('../controllers/currency');

router.get('/currency/rates', getRates);
router.post('/currency/convert', convertPrice);

module.exports = router;