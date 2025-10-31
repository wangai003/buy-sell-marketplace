const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const Location = require('../models/Location');
const Report = require('../models/Report');
const Bid = require('../models/Bid');
const cloudinary = require('../config/cloudinary').v2;
const {
  setNotificationToUnread,
  newFavoriteNotification,
  removeFavoriteNotification,
  auctionWinnerNotification,
} = require('./notification');

exports.addProduct = async (req, res) => {
    try {
      const { name, category, subcategory, element, location, description, condition, price, images, isAuction, startingBid, duration } =
        req.body;
      //validation
      if (!name || !category || !subcategory || !element || !location || !description || !price)
        return res.status(400).send('Fields marked * are required');

      // Validate hierarchy
      const categoryDoc = await Category.findById(category).exec();
      if (!categoryDoc || categoryDoc.type !== 'category') {
        return res.status(400).send('Invalid category selected');
      }

      const subcategoryDoc = await Category.findById(subcategory).exec();
      if (!subcategoryDoc || subcategoryDoc.type !== 'subcategory' || subcategoryDoc.parent.toString() !== category) {
        return res.status(400).send('Invalid subcategory selected');
      }

      const elementDoc = await Category.findById(element).exec();
      if (!elementDoc || elementDoc.type !== 'element' || elementDoc.parent.toString() !== subcategory) {
        return res.status(400).send('Invalid element selected');
      }

      // Check if this is an auction category (Live Bidding Hub)
      const isAuctionCategory = categoryDoc.name === 'Live Bidding Hub';

      // Validate auction fields only for auction categories
      if (isAuctionCategory) {
        if (!startingBid || !duration) {
          return res.status(400).send('Starting bid and duration are required for auctions');
        }
        if (startingBid <= 0 || duration <= 0) {
          return res.status(400).send('Invalid auction parameters');
        }
      }

      //validate and upload images
      if (!images) return res.status(400).send('Please upload some images');
      if (images.length < 2 || images.length > 1000)
        return res.status(400).send('Please upload atleast 2 images');

      const files = [];
      const file_ids = [];
      for (let i = 0; i < images.length; i++) {
        const imageUrl = await cloudinary.uploader.upload(images[i], {
          folder: 'buynsell',
          secure: true, // Force HTTPS URLs
        });
        files.push(imageUrl.secure_url); // Use secure_url instead of url
        file_ids.push(imageUrl.public_id);
      }

      let productData = {
        name,
        category,
        subcategory,
        element,
        location,
        description,
        condition,
        price,
        images: files,
        image_ids: file_ids,
        author: req.params.userId,
      };

      // Set auction fields only for auction categories
      if (isAuctionCategory) {
        productData.isAuction = true;
        productData.startingBid = startingBid;
        productData.currentBid = startingBid;
        productData.endTime = new Date(Date.now() + duration * 60 * 60 * 1000);
        productData.duration = duration;
      }

      const product = new Product(productData);
      const newProduct = await product.save();
      const user = await User.findById(req.params.userId).exec();
      user.products.push(product._id);
      user.save();
      return res.json({ product: newProduct });
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 400) {
        return res.status(400).send(err.response.data);
      } else {
        return res.status(500).send('Internal server error');
      }
    }
  };

exports.allProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('author category subcategory element location');
    return res.json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
};

exports.singleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate(
      'category subcategory element location author reports'
    );
    return res.json(product);
  } catch (err) {
    console.log(err);
    if (err.response && err.response.status === 400) {
      return res.status(400).send(err.response.data);
    } else {
      return res.status(500).send('Internal server error');
    }
  }
};

exports.relatedProducts = async (req, res) => {
  try {
    const product = await Product.find({
      category: req.params.categoryId,
    }).populate('category subcategory element location author reports');
    return res.json(product);
  } catch (err) {
    console.log(err);
    if (err.response && err.response.status === 400) {
      return res.status(400).send(err.response.data);
    } else {
      return res.status(500).send('Internal server error');
    }
  }
};

exports.favouriteCount = async (req, res) => {
  try {
    const users = await User.find({ favourites: req.params.productId }).exec();
    return res.json(users.length);
  } catch (err) {
    console.log(err);
    if (err.response && err.response.status === 400) {
      return res.status(400).send(err.response.data);
    } else {
      return res.status(500).send('Internal server error');
    }
  }
};

exports.updateProduct = async (req, res) => {
    try {
      const {
        name,
        category,
        subcategory,
        element,
        location,
        description,
        condition,
        price,
        images,
        author,
        userAuth,
        isAuction,
        startingBid,
        duration,
      } = req.body;

      //Validate User
      const productOwner = author === userAuth;
      if (!productOwner)
        return res
          .status(400)
          .send('You are not authorized to perform this action');

      // validation;
      if (!name || !category || !subcategory || !element || !location || !description || !price)
        return res.status(400).send('Fields marked * are required');

      // Validate hierarchy
      const categoryDoc = await Category.findById(category).exec();
      if (!categoryDoc || categoryDoc.type !== 'category') {
        return res.status(400).send('Invalid category selected');
      }

      const subcategoryDoc = await Category.findById(subcategory).exec();
      if (!subcategoryDoc || subcategoryDoc.type !== 'subcategory' || subcategoryDoc.parent.toString() !== category) {
        return res.status(400).send('Invalid subcategory selected');
      }

      const elementDoc = await Category.findById(element).exec();
      if (!elementDoc || elementDoc.type !== 'element' || elementDoc.parent.toString() !== subcategory) {
        return res.status(400).send('Invalid element selected');
      }

      //validate and upload images
      if (!images) return res.status(400).send('Please upload some images');
      if (images.length < 2 || images.length > 1000)
        return res.status(400).send('Please upload atleast 2 images');

      const getIds = await Product.findById(req.params.productId);
      const file_ids = getIds.image_ids;
      const files = [];
      for (let i = 0; i < images.length; i++) {
        if (images[i].substring(11, 21) === 'cloudinary') {
          files.push(images[i]);
        }
        if (images[i].substring(11, 21) !== 'cloudinary') {
          const imageUrl = await cloudinary.uploader.upload(images[i], {
            folder: 'buynsell',
            secure: true, // Force HTTPS URLs
          });
          files.push(imageUrl.secure_url); // Use secure_url instead of url
          file_ids.push(imageUrl.public_id);
        }
      }

      const productUpdate = {
        name,
        category,
        subcategory,
        element,
        location,
        description,
        condition,
        price,
        images: files,
        image_ids: file_ids,
        status: 'pending',
      };

      if (isAuction !== undefined) {
        productUpdate.isAuction = isAuction;
        if (isAuction) {
          if (!startingBid || !duration) {
            return res.status(400).send('Starting bid and duration are required for auctions');
          }
          if (startingBid <= 0 || duration <= 0) {
            return res.status(400).send('Invalid auction parameters');
          }
          productUpdate.startingBid = startingBid;
          productUpdate.currentBid = startingBid;
          productUpdate.endTime = new Date(Date.now() + duration * 60 * 60 * 1000);
          productUpdate.duration = duration;
        } else {
          productUpdate.startingBid = undefined;
          productUpdate.currentBid = undefined;
          productUpdate.endTime = undefined;
          productUpdate.duration = undefined;
        }
      }

      const product = await Product.findOneAndUpdate(
        { _id: req.params.productId },
        { $set: productUpdate },
        { new: true, useFindAndModify: false }
      );
      return res.json(product);
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 400) {
        return res.status(400).send(err.response.data);
      } else {
        return res.status(500).send('Internal server error');
      }
    }
  };

exports.closeProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).exec();
    product.status = 'closed';
    product.save();
    return res.json(product);
  } catch (err) {
    console.log('CLOSE PRODUCT FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const { imageId, imageUrl } = req.body;
    const product = await Product.findById(req.params.productId).exec();
    if (product) {
      const deleteUlr = product.images.indexOf(imageUrl);
      product.images.splice(deleteUlr, 1);
      const deleteId = product.image_ids.indexOf(imageId);
      product.image_ids.splice(deleteId, 1);
      product.save();
      res.json(product);
    }
    cloudinary.uploader.destroy(imageId, function (error, result) {
      console.log(result, error);
    });
  } catch (err) {
    console.log('IMAGE DELETE FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.addFavourite = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id).exec();
    user.favourites.push(req.params.productId);
    await user.save();

    const product = await Product.findById(req.params.productId);
    console.log(product.author);

    if (product.author.toString() !== req.body.user._id) {
      await newFavoriteNotification(
        req.body.user._id,
        req.params.productId,
        product.author.toString()
      );
    }
    user.password = undefined;
    return res.json(user);
  } catch (err) {
    console.log('ADD FAVOURITE FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};
exports.removeFavourite = async (req, res) => {
  try {
    const user = await User.findById(req.body.user._id).exec();
    if (user) {
      const removeFav = user.favourites.indexOf(req.params.productId);
      user.favourites.splice(removeFav, 1);
      user.save();

      const product = await Product.findById(req.params.productId);

      if (product.author.toString() !== req.body.user._id) {
        await removeFavoriteNotification(
          req.body.user._id,
          req.params.productId,
          product.author.toString()
        );
      }

      user.password = undefined;
      return res.json(user);
    }
  } catch (err) {
    console.log('REMOVE FAVOURITE FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.categoryId,
    }).populate('author category subcategory element location');
    return res.json(products);
  } catch (err) {
    console.log('GET CATEGORY FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};
exports.getByFilter = async (req, res) => {
  try {
    console.log(req.body);
    let findArgs = {};

    for (let key in req.body.filters) {
      if (req.body.filters[key].length > 0) {
        if (key === 'price') {
          findArgs[key] = {
            $gte: req.body.filters[key][0],
            $lte: req.body.filters[key][1],
          };
        } else {
          findArgs[key] = req.body.filters[key];
        }
      }
    }

    const products = await Product.find(findArgs)
      .sort({ createdAt: req.body.sortBy })
      .populate('author category subcategory element location')
      .exec();
    res.json(products);
  } catch (err) {
    console.log('GET BY FILTER FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.allCategories = async (req, res) => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'category',
        as: 'products',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        productCount: { $size: '$products' },
      },
    },
  ]).exec();

  res.json(categories);
};
exports.allLocations = async (req, res) => {
  const locations = await Location.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'location',
        as: 'products',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        productCount: { $size: '$products' },
      },
    },
  ]).exec();

  res.json(locations);
};

exports.searchResults = async (req, res) => {
  let query = {};

  for (let key in req.body) {
    if (req.body[key].length > 0) {
      if (key === 'name') {
        query[key] = new RegExp(req.body.name, 'i');
      } else if (key === 'price') {
        query[key] = {
          $gte: req.body[key][0],
          $lte: req.body[key][1],
        };
      } else {
        query[key] = req.body[key];
      }
    }
  }

  let result = await Product.find(query)
    .sort({ createdAt: '-1' })
    .populate('author category subcategory element location');
  res.json(result);
};

exports.reportProduct = async (req, res) => {
  const { reason, details, product, author } = req.body;
  try {
    const report = new Report({
      reason,
      details,
      product,
      author,
    });

    const newReport = await report.save();
    const productReport = await Product.findById(product);
    productReport.reports.push(newReport._id);
    productReport.save();
    res.json(newReport);
  } catch (err) {
    console.log('REPORT PRODUCT FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.getReportedProducts = async (req, res) => {
  try {
    const reported = await Report.find().populate('author product').exec();
    res.json(reported);
  } catch (err) {
    console.log('GET PRODUCTED PRODUCTS FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.placeBid = async (req, res) => {
  try {
    const { amount } = req.body;
    const productId = req.params.productId;
    const bidderId = req.user._id;

    // Find the product
    const product = await Product.findById(productId).populate('author');
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Check if product is an auction
    if (!product.isAuction) {
      return res.status(400).send('This product is not available for bidding');
    }

    // Check if auction is active
    if (product.status !== 'active' || new Date() > product.endTime) {
      return res.status(400).send('Auction is not active');
    }

    // Check if bidder is not the seller
    if (product.author._id.toString() === bidderId) {
      return res.status(400).send('Seller cannot bid on their own product');
    }

    // Check if bid is higher than current bid or starting bid
    const currentBid = product.currentBid || product.startingBid || 0;
    if (amount <= currentBid) {
      return res.status(400).send('Bid must be higher than current bid');
    }

    // Create new bid
    const bid = new Bid({
      bidder: bidderId,
      product: productId,
      amount,
    });

    await bid.save();

    // Update product's current bid and add bid to product's bids array
    product.currentBid = amount;
    product.bids.push(bid._id);
    await product.save();

    res.json({ message: 'Bid placed successfully', bid });
  } catch (err) {
    console.log('PLACE BID FAILED', err);
    return res.status(500).send('Internal server error');
  }
};

exports.getBids = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Find all bids for the product
    const bids = await Bid.find({ product: productId })
      .populate('bidder', 'name email')
      .sort({ amount: -1, createdAt: -1 });

    res.json(bids);
  } catch (err) {
    console.log('GET BIDS FAILED', err);
    return res.status(500).send('Internal server error');
  }
};

exports.processEndedAuctions = async (req, res) => {
  try {
    const currentTime = new Date();

    // Find all active auctions that have ended
    const endedAuctions = await Product.find({
      isAuction: true,
      status: 'active',
      endTime: { $lt: currentTime }
    }).populate('author bids');

    console.log(`Found ${endedAuctions.length} ended auctions to process`);

    const results = [];

    for (const auction of endedAuctions) {
      try {
        // Find the highest bid
        const bids = await Bid.find({ product: auction._id })
          .populate('bidder')
          .sort({ amount: -1 });

        if (bids.length > 0) {
          // There are bids - create order for winner
          const winningBid = bids[0];
          const winner = winningBid.bidder;
          const seller = auction.author;

          // Create order
          const order = new Order({
            productId: auction._id,
            productName: auction.name,
            price: winningBid.amount,
            buyerId: winner._id,
            buyerName: winner.name,
            sellerId: seller._id,
            sellerName: seller.name,
            sellerWallet: seller.wallet,
            status: 'AWAITING_PAYMENT',
            statusHistory: [{
              status: 'AWAITING_PAYMENT',
              changedAt: new Date()
            }]
          });

          await order.save();

          // Send notification to winner
          await auctionWinnerNotification(winner._id, auction._id, auction.name, winningBid.amount);

          // Update product status to sold
          auction.status = 'sold';
          await auction.save();

          results.push({
            auctionId: auction._id,
            status: 'sold',
            winner: winner.name,
            winningBid: winningBid.amount,
            orderId: order._id
          });

          console.log(`Auction ${auction._id} sold to ${winner.name} for ${winningBid.amount}`);
        } else {
          // No bids - mark as ended_no_bids
          auction.status = 'ended_no_bids';
          await auction.save();

          results.push({
            auctionId: auction._id,
            status: 'ended_no_bids',
            winner: null,
            winningBid: null,
            orderId: null
          });

          console.log(`Auction ${auction._id} ended with no bids`);
        }
      } catch (auctionError) {
        console.error(`Error processing auction ${auction._id}:`, auctionError);
        results.push({
          auctionId: auction._id,
          status: 'error',
          error: auctionError.message
        });
      }
    }

    res.json({
      message: `Processed ${endedAuctions.length} ended auctions`,
      results
    });
  } catch (err) {
    console.log('PROCESS ENDED AUCTIONS FAILED', err);
    return res.status(500).send('Internal server error');
  }
};
