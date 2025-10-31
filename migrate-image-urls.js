const mongoose = require('mongoose');
const Product = require('./models/Product');
const Advertisement = require('./models/Advertisement');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
})
.then(() => console.log('Database Connected for Migration'))
.catch((err) => console.log(err));

// Function to convert HTTP URLs to HTTPS
const convertToHttps = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

const migrateImageUrls = async () => {
  try {
    console.log('Starting image URL migration...');

    // Migrate Product images
    console.log('Migrating product images...');
    const products = await Product.find({});
    let productUpdates = 0;

    for (const product of products) {
      let updated = false;
      const newImages = product.images.map(convertToHttps);

      if (JSON.stringify(newImages) !== JSON.stringify(product.images)) {
        product.images = newImages;
        await product.save();
        productUpdates++;
      }
    }
    console.log(`Updated ${productUpdates} products`);

    // Migrate Advertisement images
    console.log('Migrating advertisement images...');
    const ads = await Advertisement.find({});
    let adUpdates = 0;

    for (const ad of ads) {
      const newImage = convertToHttps(ad.image);
      if (newImage !== ad.image) {
        ad.image = newImage;
        await ad.save();
        adUpdates++;
      }
    }
    console.log(`Updated ${adUpdates} advertisements`);

    // Migrate User profile photos
    console.log('Migrating user profile photos...');
    const users = await User.find({});
    let userUpdates = 0;

    for (const user of users) {
      const newPhoto = convertToHttps(user.photo);
      if (newPhoto !== user.photo) {
        user.photo = newPhoto;
        await user.save();
        userUpdates++;
      }
    }
    console.log(`Updated ${userUpdates} users`);

    console.log('Migration completed successfully!');
    console.log(`Total updates: ${productUpdates + adUpdates + userUpdates}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the migration
migrateImageUrls();