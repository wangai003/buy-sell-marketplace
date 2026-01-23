const User = require('../models/User');
const { subscriptionRequiredNotification } = require('./notification');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary').v2;
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const {
  newFollowerNotification,
  removeFollowerNotification,
} = require('./notification');
const { getTier, canAccessConnections, getConnectionsLimit, SUBSCRIPTION_TIERS } = require('../config/subscriptionTiers');

exports.userProfile = async (req, res) => {
  let user = await User.findById(req.params.userId)
    .populate([
      { path: 'ratings', populate: { path: 'author', select: '-password' } },
      { path: 'products', populate: { path: 'author', select: '-password' } },
      { path: 'products', populate: { path: 'category' } },
      { path: 'products', populate: { path: 'location' } },
      { path: 'sellerCategories' },
    ])
    .exec();

  // Convert any HTTP image URLs to HTTPS
  if (user.photo) {
    user.photo = user.photo.replace(/^http:\/\//i, 'https://');
  }
  if (user.businessLogo) {
    user.businessLogo = user.businessLogo.replace(/^http:\/\//i, 'https://');
  }
  if (user.products && Array.isArray(user.products)) {
    user.products = user.products.map(product => {
      if (product.images && Array.isArray(product.images)) {
        product.images = product.images.map(url =>
          url ? url.replace(/^http:\/\//i, 'https://') : url
        );
      }
      return product;
    });
  }

  user.password = undefined;
  return res.json(user);
};
exports.userProfile2 = async (req, res) => {
  let user = await User.findById(req.params.userId)
    .populate([{ path: 'followers' }, { path: 'following' }])
    .exec();
  console.log(user.followers.length);
  user.password = undefined;
  return res.json(user);
};
exports.reduxUser = async (req, res) => {
  let user = await User.findById(req.params.userId)
    .populate([{ path: 'followers' }, { path: 'following' }])
    .exec();
  user.password = undefined;
  return res.json(user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, username, phone, location, photo, wallet, _id, interestedCategories } = req.body;

    //Validate User
    const profileOwner = req.params.userId === _id;
    if (!profileOwner)
      return res
        .status(400)
        .send('You are not authorized to perform this action');

    //validate fields
    if (!name || !email || !username || !phone)
      return res.status(400).send('All fields are required');

    //validate phone
    let phoneno = /^\d{11}$/;
    if (!phone.match(phoneno))
      return res.status(400).send('Phone number must be 11 characters long');
    //   const imageUrl = req.file ? req.file.path : undefined;

    const imageUrl =
      !photo || photo.substring(11, 21) === 'cloudinary'
        ? ''
        : await cloudinary.uploader.upload(photo, {
            public_id: getUser.photo_id,
            overwrite: true,
            invalidate: true,
            folder: 'buynsell/profileimages/',
            secure: true, // Force HTTPS URLs
          });

    let updatedUser = {
      name: name,
      email: email,
      username: username,
      phone: phone,
      photo:
        !photo || photo.substring(11, 21) === 'cloudinary'
          ? undefined
          : imageUrl.secure_url,
      location: location,
      photo_id:
        !photo || photo.substring(11, 21) === 'cloudinary'
          ? undefined
          : imageUrl.public_id,
      wallet: wallet,
    };

    // Handle interestedCategories if provided
    if (interestedCategories !== undefined) {
      updatedUser.interestedCategories = interestedCategories;
    }

    for (let prop in updatedUser)
      if (!updatedUser[prop] && prop !== 'interestedCategories') delete updatedUser[prop];

    const user = await User.findOneAndUpdate(
      { _id: req.params.userId },
      { $set: updatedUser },
      { new: true, useFindAndModify: false }
    );
    // Populate interestedCategories for response
    const populatedUser = await User.findById(user._id)
      .populate('interestedCategories')
      .select('-password')
      .exec();

    res.json({
      _id: populatedUser._id,
      name: populatedUser.name,
      email: populatedUser.email,
      username: populatedUser.username,
      phone: populatedUser.phone,
      photo: populatedUser.photo,
      role: populatedUser.role,
      location: populatedUser.location,
      wallet: populatedUser.wallet,
      interestedCategories: populatedUser.interestedCategories,
      canSell: populatedUser.canSell,
      businessName: populatedUser.businessName,
      businessLogo: populatedUser.businessLogo,
      businessPhone: populatedUser.businessPhone,
      socialMediaLinks: populatedUser.socialMediaLinks,
      sellerCategories: populatedUser.sellerCategories,
      createdAt: populatedUser.createdAt,
      updatedAt: populatedUser.updatedAt,
    });
  } catch (err) {
    console.log('UPDATE USER FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.updatePassword = async (req, res) => {
  const { oldPassword, password, newPasswordConfirm, userAuth } = req.body;

  try {
    //Validate User
    const profileOwner = req.params.userId === userAuth;
    if (!profileOwner)
      return res
        .status(400)
        .send('You are not authorized to perform this action');

    // validate fields
    if (!oldPassword || !password || !newPasswordConfirm)
      return res.status(400).send('All fields are required');

    //check password length and if it contains a number
    let hasNumber = /\d/;
    if (password.length < 6)
      return res
        .status(400)
        .send('Pasword too short, must be 6 characters and above');
    if (!hasNumber.test(password))
      return res.status(400).send('Pasword must contain a number');

    //validate new password fields
    if (newPasswordConfirm !== password)
      return res.status(400).send('New password fields does not match.');

    // get user
    const user = await User.findById(req.params.userId);
    console.log(user);
    if (!user) {
      return res.status(400).send('User not found');
    }

    // validate old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).send('Please enter correct old password');
    }
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).send('New password must not be same as old');
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // update user's password
    user.password = hashedPassword;
    const updatedUser = await user.save();

    return res.json({ user: updatedUser });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Something went wrong. Try again');
  }
};

exports.followUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.userId);
    if (user) {
      user.followers.push(req.user._id);
      user.save();
      res.json(user);
    }
    let actionUser = await User.findById(req.user._id);
    if (actionUser) {
      actionUser.following.push(req.params.userId);
      actionUser.save();
    }
    await newFollowerNotification(actionUser._id, user._id);
  } catch (err) {
    console.log(err);
    return res.status(500).send('Something went wrong. Try again');
  }
};
exports.unfollowUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.userId);
    const userId = user.followers.indexOf(req.user._id);
    user.followers.splice(userId, 1);
    user.save();
    res.json(user);

    let actionUser = await User.findById(req.user._id);
    if (actionUser) {
      const actionUserId = actionUser.following.indexOf(req.params.userId);
      actionUser.following.splice(actionUserId, 1);
      actionUser.save();
    }
    await removeFollowerNotification(
      actionUser._id.toString(),
      user._id.toString()
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send('Something went wrong. Try again');
  }
};

exports.userProducts = async (req, res) => {
  try {
    const products = await Product.find({
      author: req.params.userId,
      status: req.body.filter,
    })
      .sort({ createdAt: '-1' })
      .populate('author category location')
      .exec();
    res.json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).send('Something went wrong. Try again');
  }
};
exports.userActiveProducts = async (req, res) => {
  try {
    const products = await Product.find({
      author: req.params.userId,
      status: 'active',
    })
      .sort({ createdAt: '-1' })
      .populate('author category location')
      .exec();
    res.json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).send('Something went wrong. Try again');
  }
};
exports.userPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({
      author: req.params.userId,
      status: 'pending',
    })
      .sort({ createdAt: '-1' })
      .populate('author category location')
      .exec();
    res.json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).send('Something went wrong. Try again');
  }
};
exports.userClosedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      author: req.params.userId,
      status: 'closed',
    })
      .sort({ createdAt: '-1' })
      .populate('author category location')
      .exec();
    res.json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).send('Something went wrong. Try again');
  }
};
exports.favouriteProducts = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .sort({ createdAt: '-1' })
      .populate([
        { path: 'favourites', populate: { path: 'author' } },
        { path: 'favourites', populate: { path: 'category' } },
        { path: 'favourites', populate: { path: 'location' } },
      ])
      .exec();
    res.json(user.favourites);
  } catch (err) {
    console.log(err);
    return res.status(500).send('Something went wrong. Try again');
  }
};

exports.submitSellerApplication = async (req, res) => {
  try {
    const { businessName, businessPhone, socialMediaLinks, sellerCategories, _id, businessLogo } = req.body;

    // Validate user
    const profileOwner = req.params.userId === _id;
    if (!profileOwner) {
      return res.status(400).send('You are not authorized to perform this action');
    }

    // Validate required fields
    if (!businessName || !businessPhone || !businessLogo) {
      return res.status(400).send('Business name, phone, and logo are required');
    }

    // Validate at least one social media link
    if (!socialMediaLinks || Object.keys(socialMediaLinks).length === 0) {
      return res.status(400).send('Please provide at least one social media link');
    }

    // Validate at least one category selected
    if (!sellerCategories || sellerCategories.length === 0) {
      return res.status(400).send('Please select at least one category');
    }

    // Validate phone number format
    let phoneno = /^\d{11}$/;
    if (!businessPhone.match(phoneno)) {
      return res.status(400).send('Business phone number must be 11 digits long');
    }

    // Get user
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Upload business logo to Cloudinary if it's a new image
    let logoUrl = '';
    let logoId = '';
    if (businessLogo && businessLogo.substring(11, 21) !== 'cloudinary') {
      const logoUpload = await cloudinary.uploader.upload(businessLogo, {
        folder: 'buynsell/businesslogos/',
        secure: true,
      });
      logoUrl = logoUpload.secure_url;
      logoId = logoUpload.public_id;
    } else if (businessLogo) {
      // Logo already uploaded, use existing URL
      logoUrl = businessLogo;
      logoId = user.businessLogo_id || '';
    }

    // Update user with business information
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.userId },
      {
        $set: {
          businessName: businessName,
          businessPhone: businessPhone,
          businessLogo: logoUrl,
          businessLogo_id: logoId,
          socialMediaLinks: socialMediaLinks,
          sellerCategories: sellerCategories,
          canSell: true, // Automatically approve seller status
        },
      },
      { new: true, useFindAndModify: false }
    ).populate('sellerCategories');

    updatedUser.password = undefined;
    return res.json({
      message: 'Seller application submitted successfully! You now have seller privileges.',
      user: updatedUser,
    });
  } catch (err) {
    console.log('SUBMIT SELLER APPLICATION FAILED', err);
    return res.status(500).send('Error submitting application. Try again');
  }
};

exports.getStoresForYou = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).exec();
    
    if (!user || !user.interestedCategories || user.interestedCategories.length === 0) {
      return res.json([]);
    }

    // Find sellers whose sellerCategories intersect with user's interestedCategories
    const sellers = await User.find({
      canSell: true,
      sellerCategories: { $in: user.interestedCategories }
    })
    .populate('sellerCategories')
    .select('-password -favourites -followers -following -products -ratings')
    .exec();

    // Convert any HTTP image URLs to HTTPS
    const sanitizedSellers = sellers.map(seller => {
      if (seller.businessLogo) {
        seller.businessLogo = seller.businessLogo.replace(/^http:\/\//i, 'https://');
      }
      if (seller.photo) {
        seller.photo = seller.photo.replace(/^http:\/\//i, 'https://');
      }
      return seller;
    });

    return res.json(sanitizedSellers);
  } catch (err) {
    console.log('GET STORES FOR YOU FAILED', err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
};

// Helper to reset monthly usage if needed
const resetMonthlyUsageIfNeeded = (seller) => {
  const now = new Date();
  
  if (!seller.monthlyConnectionUsageResetDate || new Date(seller.monthlyConnectionUsageResetDate) <= now) {
    seller.monthlyConnectionUsage = 0;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    seller.monthlyConnectionUsageResetDate = nextMonth;
  }
  
  if (!seller.monthlyAdvertisingDaysResetDate || new Date(seller.monthlyAdvertisingDaysResetDate) <= now) {
    seller.monthlyAdvertisingDaysUsed = 0;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    seller.monthlyAdvertisingDaysResetDate = nextMonth;
  }
  
  if (!seller.monthlyCreativeRequestsResetDate || new Date(seller.monthlyCreativeRequestsResetDate) <= now) {
    seller.monthlyCreativeRequestsUsed = 0;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    seller.monthlyCreativeRequestsResetDate = nextMonth;
  }
};

const isConnectionsSubscriptionActive = (seller) => {
  if (!seller) {
    return false;
  }
  
  // Check new subscription fields first, fallback to legacy
  const activeUntil = seller.subscriptionActiveUntil || seller.connectionsSubscriptionActiveUntil;
  if (!activeUntil) {
    return false;
  }
  
  const isActive = new Date(activeUntil) > new Date();
  if (!isActive) {
    return false;
  }
  
  // Check if tier allows connections
  const tier = seller.subscriptionTier || 'FREE';
  return canAccessConnections(tier);
};

exports.getConnectionsSubscriptionStatus = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    if (req.user && req.user._id.toString() !== sellerId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const seller = await User.findById(sellerId).select(
      'subscriptionTier subscriptionBillingCycle subscriptionActiveUntil connectionsSubscriptionActiveUntil monthlyConnectionUsage monthlyConnectionUsageResetDate'
    );
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Reset usage if needed
    resetMonthlyUsageIfNeeded(seller);
    await seller.save();

    const tier = seller.subscriptionTier || 'FREE';
    const tierConfig = getTier(tier);
    const activeUntil = seller.subscriptionActiveUntil || seller.connectionsSubscriptionActiveUntil || null;
    const isActive = isConnectionsSubscriptionActive(seller);
    const connectionsLimit = getConnectionsLimit(tier);
    const connectionsUsed = seller.monthlyConnectionUsage || 0;
    const connectionsRemaining = connectionsLimit === -1 ? -1 : Math.max(0, connectionsLimit - connectionsUsed);

    return res.json({
      tier,
      billingCycle: seller.subscriptionBillingCycle || 'monthly',
      activeUntil,
      isActive,
      tierConfig: {
        name: tierConfig.displayName,
        connectionsPerMonth: connectionsLimit,
        advertisingDaysPerMonth: tierConfig.features.advertisingDaysPerMonth,
        creativeRequestsPerMonth: tierConfig.features.creativeRequestsPerMonth,
        badge: tierConfig.features.badge,
      },
      usage: {
        connectionsUsed,
        connectionsRemaining,
        connectionsLimit,
      },
    });
  } catch (err) {
    console.log('GET CONNECTIONS SUBSCRIPTION STATUS FAILED', err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
};

// Get available subscription tiers
exports.getSubscriptionTiers = async (req, res) => {
  try {
    const tiers = Object.keys(SUBSCRIPTION_TIERS).map(key => {
      const tier = SUBSCRIPTION_TIERS[key];
      return {
        name: tier.name,
        displayName: tier.displayName,
        monthlyPrice: tier.monthlyPrice,
        yearlyPrice: tier.yearlyPrice,
        yearlyOriginalPrice: tier.yearlyOriginalPrice,
        yearlyDiscount: tier.yearlyDiscount,
        features: tier.features,
        description: tier.description,
        whatYouGet: tier.whatYouGet,
        whatsLocked: tier.whatsLocked,
        whatYouUnlock: tier.whatYouUnlock,
      };
    });
    
    return res.json({ tiers });
  } catch (err) {
    console.log('GET SUBSCRIPTION TIERS FAILED', err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
};

// Get potential connections (buyers with matching interests who aren't connected)
exports.getPotentialConnections = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const seller = await User.findById(sellerId).exec();
    
    if (!seller || !seller.canSell || !seller.sellerCategories || seller.sellerCategories.length === 0) {
      return res.json([]);
    }

    // Reset monthly usage if needed
    resetMonthlyUsageIfNeeded(seller);

    if (!isConnectionsSubscriptionActive(seller)) {
      await subscriptionRequiredNotification(sellerId);
      return res.status(402).json({
        error: 'Subscription required',
        subscriptionRequired: true,
        activeUntil: seller.subscriptionActiveUntil || seller.connectionsSubscriptionActiveUntil || null,
      });
    }

    // Check tier limits
    const tier = seller.subscriptionTier || 'FREE';
    const connectionsLimit = getConnectionsLimit(tier);
    const connectionsUsed = seller.monthlyConnectionUsage || 0;

    // If limit is reached (and not unlimited)
    if (connectionsLimit !== -1 && connectionsUsed >= connectionsLimit) {
      return res.status(403).json({
        error: 'Monthly connection limit reached',
        connectionsUsed,
        connectionsLimit,
        resetDate: seller.monthlyConnectionUsageResetDate,
      });
    }

    // Get seller's connected buyers IDs
    const connectedBuyerIds = seller.connectedBuyers || [];

    // Find buyers whose interestedCategories intersect with seller's sellerCategories
    // and who are not already connected
    const sellerObjectId = mongoose.Types.ObjectId.isValid(sellerId) 
      ? mongoose.Types.ObjectId(sellerId) 
      : sellerId;
    const allExcludedIds = [
      ...connectedBuyerIds,
      sellerObjectId
    ];
    let potentialBuyers = await User.find({
      _id: { $nin: allExcludedIds }, // Not already connected and not the seller themselves
      interestedCategories: { $in: seller.sellerCategories },
      canSell: false, // Only buyers, not other sellers
    })
    .populate('interestedCategories')
    .select('-password -favourites -followers -following -products -ratings -sellerCategories -connectedBuyers')
    .exec();

    // Apply tier limit to results (if not unlimited)
    if (connectionsLimit !== -1) {
      const remaining = connectionsLimit - connectionsUsed;
      potentialBuyers = potentialBuyers.slice(0, remaining);
    }

    // Convert any HTTP image URLs to HTTPS
    const sanitizedBuyers = potentialBuyers.map(buyer => {
      if (buyer.photo) {
        buyer.photo = buyer.photo.replace(/^http:\/\//i, 'https://');
      }
      return buyer;
    });

    return res.json(sanitizedBuyers);
  } catch (err) {
    console.log('GET POTENTIAL CONNECTIONS FAILED', err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
};

// Get connected buyers
exports.getConnectedBuyers = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const seller = await User.findById(sellerId)
      .populate('connectedBuyers')
      .exec();
    
    if (!seller || !seller.canSell) {
      return res.json([]);
    }

    const connectedBuyers = seller.connectedBuyers || [];

    // Populate interestedCategories for each connected buyer
    const populatedBuyers = await User.find({
      _id: { $in: connectedBuyers.map(b => b._id || b) }
    })
    .populate('interestedCategories')
    .select('-password -favourites -followers -following -products -ratings -sellerCategories -connectedBuyers')
    .exec();

    // Convert any HTTP image URLs to HTTPS
    const sanitizedBuyers = populatedBuyers.map(buyer => {
      if (buyer.photo) {
        buyer.photo = buyer.photo.replace(/^http:\/\//i, 'https://');
      }
      return buyer;
    });

    return res.json(sanitizedBuyers);
  } catch (err) {
    console.log('GET CONNECTED BUYERS FAILED', err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
};

// Create connection between seller and buyer
exports.createConnection = async (req, res) => {
  try {
    const { sellerId, buyerId } = req.body;

    if (!sellerId || !buyerId) {
      return res.status(400).json({ error: 'Seller ID and Buyer ID are required' });
    }

    const seller = await User.findById(sellerId).exec();
    const buyer = await User.findById(buyerId).exec();

    if (!seller || !seller.canSell) {
      return res.status(400).json({ error: 'Invalid seller' });
    }

    if (!buyer) {
      return res.status(400).json({ error: 'Invalid buyer' });
    }

    // Reset monthly usage if needed
    resetMonthlyUsageIfNeeded(seller);

    if (!isConnectionsSubscriptionActive(seller)) {
      await subscriptionRequiredNotification(sellerId);
      return res.status(402).json({
        error: 'Subscription required',
        subscriptionRequired: true,
        activeUntil: seller.subscriptionActiveUntil || seller.connectionsSubscriptionActiveUntil || null,
      });
    }

    // Check tier limits
    const tier = seller.subscriptionTier || 'FREE';
    const connectionsLimit = getConnectionsLimit(tier);
    const connectionsUsed = seller.monthlyConnectionUsage || 0;

    // If limit is reached (and not unlimited)
    if (connectionsLimit !== -1 && connectionsUsed >= connectionsLimit) {
      return res.status(403).json({
        error: 'Monthly connection limit reached',
        connectionsUsed,
        connectionsLimit,
        resetDate: seller.monthlyConnectionUsageResetDate,
      });
    }

    // Check if already connected
    const buyerObjectId = mongoose.Types.ObjectId.isValid(buyerId)
      ? mongoose.Types.ObjectId(buyerId)
      : buyerId;
    const connectedBuyerIds = seller.connectedBuyers || [];
    const isConnected = connectedBuyerIds.some(id => 
      id.toString() === buyerObjectId.toString()
    );
    if (isConnected) {
      return res.status(400).json({ error: 'Already connected with this buyer' });
    }

    // Add buyer to seller's connectedBuyers
    if (!seller.connectedBuyers) {
      seller.connectedBuyers = [];
    }
    seller.connectedBuyers.push(buyerId);
    
    // Increment monthly connection usage (if not unlimited)
    if (connectionsLimit !== -1) {
      seller.monthlyConnectionUsage = (seller.monthlyConnectionUsage || 0) + 1;
    }
    
    await seller.save();

    return res.json({ 
      message: 'Connection created successfully',
      connectedBuyer: {
        _id: buyer._id,
        name: buyer.name,
        username: buyer.username,
        photo: buyer.photo,
        email: buyer.email,
        phone: buyer.phone,
        interestedCategories: buyer.interestedCategories,
      }
    });
  } catch (err) {
    console.log('CREATE CONNECTION FAILED', err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
};
