const Category = require('../models/Category');
const Location = require('../models/Location');
const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report');
const Order = require('../models/Order');
let io;
try {
  const app = require('../app');
  io = app.get('io');
} catch (e) {
  // io not available during testing
  io = null;
}

exports.users = async (req, res) => {
  try {
    const users = await User.find().exec();
    return res.json(users);
  } catch (err) {
    return res.status(400).send('Something went wrong.');
  }
};

exports.editProfile = async (req, res) => {
  try {
    const { name, email, username, phone, location, adminAuth } = req.body;

    //Validate Admin
    if (adminAuth !== 'admin')
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

    let updatedUser = {
      name: name,
      email: email,
      username: username,
      phone: phone,
    };

    for (let prop in updatedUser)
      if (!updatedUser[prop]) delete updatedUser[prop];

    const user = await User.findOneAndUpdate(
      { _id: req.params.userId },
      { $set: updatedUser },
      { new: true, useFindAndModify: false }
    );
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      photo: user.photo,
      role: user.role,
      location: user.location,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.log('UPDATE USER FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.deleteUser = async (req, res) => {
  const { adminRole } = req.body;
  console.log(req.body);
  try {
    //validate admin
    if (adminRole !== 'admin')
      return res
        .status(400)
        .send('You are not authorized to perform this action');

    const user = await User.findById(req.params.userId);
    user.remove();
    return res.json(user);
  } catch (err) {
    console.log('DELETE USER FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};
exports.banUser = async (req, res) => {
  const { adminRole } = req.body;
  try {
    //validate admin
    if (adminRole !== 'admin')
      return res
        .status(400)
        .send('You are not authorized to perform this action');

    const user = await User.findById(req.params.userId);
    user.role = 'banned';
    user.save();
    return res.json(user);
  } catch (err) {
    console.log('BAN USER FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};
exports.unbanUser = async (req, res) => {
  const { adminRole } = req.body;
  try {
    //validate admin
    if (adminRole !== 'admin')
      return res
        .status(400)
        .send('You are not authorized to perform this action');

    const user = await User.findById(req.params.userId);
    user.role = 'user';
    user.save();
    return res.json(user);
  } catch (err) {
    console.log('UNBAN USER FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.approveSeller = async (req, res) => {
  const { adminRole } = req.body;
  try {
    //validate admin
    if (adminRole !== 'admin')
      return res
        .status(400)
        .send('You are not authorized to perform this action');

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    user.canSell = true;
    user.save();
    return res.json(user);
  } catch (err) {
    console.log('APPROVE SELLER FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.revokeSeller = async (req, res) => {
  const { adminRole } = req.body;
  try {
    //validate admin
    if (adminRole !== 'admin')
      return res
        .status(400)
        .send('You are not authorized to perform this action');

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    user.canSell = false;
    user.save();
    return res.json(user);
  } catch (err) {
    console.log('REVOKE SELLER FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { name, parent, type } = req.body;
    //validation
    if (!name) return res.status(400).send('Field cannot be empty');
    if (!type) return res.status(400).send('Type is required');

    let level = 1;
    let categoryType = type;

    if (parent) {
      const parentCategory = await Category.findById(parent).exec();
      if (!parentCategory) return res.status(400).send('Parent category not found');

      // Validate parent type matches expected hierarchy
      if (type === 'subcategory' && parentCategory.type !== 'category') {
        return res.status(400).send('Subcategories must belong to a category');
      }
      if (type === 'element' && parentCategory.type !== 'subcategory') {
        return res.status(400).send('Elements must belong to a subcategory');
      }

      level = parentCategory.level + 1;
    } else {
      // Top-level categories should not have a parent
      if (type !== 'category') {
        return res.status(400).send('Only categories can be top-level');
      }
    }

    //check if category already exists at same level
    let categoryExist = await Category.findOne({
      name: name,
      parent: parent || null,
      type: type
    }).exec();
    if (categoryExist) return res.status(400).send(`${type} already exists`);

    const newCategory = new Category({
      name,
      parent: parent || null,
      type: categoryType,
      level
    });
    await newCategory.save();
    console.log(newCategory);
    return res.json(newCategory);
  } catch (err) {
    return res.status(400).send('Something went wrong.');
  }
};

exports.allCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ level: 1, createdAt: 1 }).exec();
    return res.json(categories);
  } catch (err) {
    return res.status(400).send('Something went wrong.');
  }
};

exports.getCategoriesByLevel = async (req, res) => {
  try {
    const { level, parent } = req.query;
    let query = {};

    if (level) query.level = parseInt(level);
    if (parent) query.parent = parent;

    const categories = await Category.find(query).sort({ createdAt: 1 }).exec();
    return res.json(categories);
  } catch (err) {
    return res.status(400).send('Something went wrong.');
  }
};

exports.getCategoryHierarchy = async (req, res) => {
  try {
    // Optimized: Fetch all categories in a single query instead of N+1 queries
    // This reduces from potentially 100+ queries to just 1 query
    const allCategories = await Category.find({})
      .sort({ level: 1, createdAt: 1 })
      .lean()
      .exec();

    // Build hierarchy in memory using Maps for O(1) lookups (much faster)
    const categoriesMap = new Map(); // level 1 categories
    const subcategoriesMap = new Map(); // level 2 subcategories
    const hierarchy = [];

    // First pass: Organize all categories by level and create structure
    allCategories.forEach(cat => {
      if (cat.level === 1) {
        // Top-level categories
        const categoryObj = {
          ...cat,
          subcategories: []
        };
        categoriesMap.set(cat._id.toString(), categoryObj);
        hierarchy.push(categoryObj);
      } else if (cat.level === 2) {
        // Subcategories
        const subcategoryObj = {
          ...cat,
          elements: []
        };
        subcategoriesMap.set(cat._id.toString(), subcategoryObj);
      }
      // Elements (level 3) will be handled in third pass
    });

    // Second pass: Attach subcategories to their parent categories
    allCategories.forEach(cat => {
      if (cat.level === 2 && cat.parent) {
        // Handle both ObjectId and string formats
        const parentId = cat.parent.toString ? cat.parent.toString() : String(cat.parent);
        const category = categoriesMap.get(parentId);
        if (category) {
          const subcategory = subcategoriesMap.get(cat._id.toString());
          if (subcategory) {
            category.subcategories.push(subcategory);
          }
        }
      }
    });

    // Third pass: Attach elements to their parent subcategories
    allCategories.forEach(cat => {
      if (cat.level === 3 && cat.parent) {
        // Handle both ObjectId and string formats
        const parentId = cat.parent.toString ? cat.parent.toString() : String(cat.parent);
        const subcategory = subcategoriesMap.get(parentId);
        if (subcategory && subcategory.elements) {
          subcategory.elements.push(cat);
        }
      }
    });

    // Sort subcategories and elements within each category (maintain original order)
    hierarchy.forEach(category => {
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(a.createdAt) - new Date(b.createdAt);
          }
          return 0;
        });
        category.subcategories.forEach(subcategory => {
          if (subcategory.elements && subcategory.elements.length > 0) {
            subcategory.elements.sort((a, b) => {
              if (a.createdAt && b.createdAt) {
                return new Date(a.createdAt) - new Date(b.createdAt);
              }
              return 0;
            });
          }
        });
      }
    });

    return res.json(hierarchy);
  } catch (err) {
    console.error('GET CATEGORY HIERARCHY FAILED', err);
    return res.status(400).send('Something went wrong.');
  }
};

exports.getCategory = async (req, res) => {
  let category = await Category.findById(req.params.categoryId).exec();
  res.json(category);
};

exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    //validate field
    if (!name) return res.status(400).send('Field cannot be empty');

    const newCategory = await Category.findById(req.params.categoryId);
    newCategory.name = name;
    newCategory.save();
    return res.json(newCategory);
  } catch (err) {
    console.log('UPDATE CATEGORY FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    category.remove();
    return res.json(category);
  } catch (err) {
    console.log('DELETE CATEGORY FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.createNestedCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    // Validation
    if (!name) return res.status(400).send('Category name is required');
    if (!subcategories || !Array.isArray(subcategories) || subcategories.length === 0) {
      return res.status(400).send('At least one subcategory is required');
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name, type: 'category' });
    if (existingCategory) return res.status(400).send('Category already exists');

    // Create main category
    const category = new Category({
      name,
      type: 'category',
      level: 1,
      parent: null
    });
    const savedCategory = await category.save();

    const createdSubcategories = [];

    // Create subcategories and their elements
    for (const subData of subcategories) {
      if (!subData.name) continue;

      // Check if subcategory already exists under this category
      const existingSub = await Category.findOne({
        name: subData.name,
        parent: savedCategory._id,
        type: 'subcategory'
      });
      if (existingSub) continue;

      const subcategory = new Category({
        name: subData.name,
        type: 'subcategory',
        level: 2,
        parent: savedCategory._id
      });
      const savedSubcategory = await subcategory.save();

      const createdElements = [];

      // Create elements if provided
      if (subData.elements && Array.isArray(subData.elements)) {
        for (const elemData of subData.elements) {
          if (!elemData.name) continue;

          // Check if element already exists under this subcategory
          const existingElem = await Category.findOne({
            name: elemData.name,
            parent: savedSubcategory._id,
            type: 'element'
          });
          if (existingElem) continue;

          const element = new Category({
            name: elemData.name,
            type: 'element',
            level: 3,
            parent: savedSubcategory._id
          });
          await element.save();
          createdElements.push(element);
        }
      }

      createdSubcategories.push({
        ...savedSubcategory.toObject(),
        elements: createdElements
      });
    }

    return res.json({
      ...savedCategory.toObject(),
      subcategories: createdSubcategories
    });

  } catch (err) {
    console.log('CREATE NESTED CATEGORY FAILED', err);
    return res.status(400).send('Error creating nested category');
  }
};

exports.addLocation = async (req, res) => {
  try {
    const { name } = req.body;
    //validation
    if (!name) return res.status(400).send('Field cannot be empty');
    //check if location already exists
    let locationExist = await Location.findOne({ name: name }).exec();
    if (locationExist) return res.status(400).send('Location already exists');

    const newLocation = new Location(req.body);
    newLocation.save();
    console.log(newLocation);
    return res.json(newLocation);
  } catch (err) {
    return res.status(400).send('Something went wrong.');
  }
};

exports.allLocations = async (req, res) => {
  try {
    const locations = await Location.find().exec();
    return res.json(locations);
  } catch (err) {
    return res.status(400).send('Something went wrong.');
  }
};

exports.getLocation = async (req, res) => {
  let location = await Location.findById(req.params.locationId).exec();
  res.json(location);
};

exports.updateLocation = async (req, res) => {
  try {
    const { name } = req.body;

    //validate field
    if (!name) return res.status(400).send('Field cannot be empty');

    const newLocation = await Location.findById(req.params.locationId);
    newLocation.name = name;
    newLocation.save();
    return res.json(newLocation);
  } catch (err) {
    console.log('UPDATE LOCATION FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);
    location.remove();
    return res.json(location);
  } catch (err) {
    console.log('DELETE LOCATION FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.productStatus = (req, res) => {
  res.json(Product.schema.path('status').enumValues);
};

exports.updateProductStatus = async (req, res) => {
  try {
    const { productId, status, token } = req.body;
    const product = await Product.findById({ _id: productId }).exec();
    product.status = status;
    if (product.status === 'active' && product.reports.length > 0) {
      product.reports = [];
    }
    product.save();
    return res.json(product);
  } catch (err) {
    console.log('UPDATE STATUS FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.pendingProducts = async (req, res) => {
  try {
    const product = await Product.find({ status: 'pending' })
      .populate('author category location')
      .exec();
    res.json(product);
  } catch (err) {
    console.log('GET PENDING PRODUCTS FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};
exports.activeProducts = async (req, res) => {
  try {
    const product = await Product.find({ status: 'active' })
      .populate('author category location')
      .exec();
    res.json(product);
  } catch (err) {
    console.log('GET PENDING ACTIVE FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.approveReport = async (req, res) => {
  try {
    console.log(req.params.productId);
    const product = await Product.findById(req.params.productId).exec();
    product.status = 'closed';
    product.save();

    await Report.deleteMany({
      product: req.params.productId,
    }).exec();

    return res.json(product);
  } catch (err) {
    console.log('REPORT APPROVE FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};
exports.rejectReport = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).exec();
    product.reports = [];
    product.save();

    await Report.deleteMany({
      product: req.params.productId,
    }).exec();

    return res.json(product);
  } catch (err) {
    console.log('REPORT REJECT FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.getPendingPayOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'PENDING_PAY' })
      .populate('productId buyerId sellerId')
      .exec();
    return res.json(orders);
  } catch (err) {
    console.log('GET PENDING PAY ORDERS FAILED', err);
    return res.status(400).send('Error. Try again');
  }
};

exports.paySeller = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order || order.status !== 'PENDING_PAY') {
      return res.status(404).json({ error: 'Order not found or not in PENDING_PAY status' });
    }

    // Calculate fees: 10% platform, 90% seller
    const platformFee = order.paidAmount * 0.1;
    const sellerPayout = order.paidAmount * 0.9;

    order.platformFee = platformFee;
    order.sellerPayout = sellerPayout;
    order.status = 'PAID';
    order.statusHistory.push({ status: 'PAID', changedAt: new Date() });

    await order.save();

    // Emit real-time update
    if (io) {
      io.emit('orderStatusChanged', { orderId: order._id, status: 'PAID' });
    }

    res.json({ message: 'Seller paid successfully', order });
  } catch (error) {
    console.error('Error paying seller:', error);
    res.status(500).json({ error: 'Failed to pay seller' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate({
        path: 'productId',
        select: 'name images price',
        model: 'Product'
      })
      .populate({
        path: 'buyerId',
        select: 'name username email',
        model: 'User'
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
      buyerId: order.buyerId || null,
      sellerId: order.sellerId || null
    }));
    
    return res.json(sanitizedOrders);
  } catch (err) {
    console.log('GET ALL ORDERS FAILED', err);
    console.error('Error details:', err.stack);
    return res.status(500).json({ error: 'Error fetching orders', details: err.message });
  }
};
