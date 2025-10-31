// Migration script to convert existing categories to hierarchical structure
// Run this script once after deploying the new category system

const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

async function migrateCategories() {
  try {
    // Connect to database
    await mongoose.connect(process.env.LOCAL_DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    });

    console.log('Connected to database');

    // Get all existing categories
    const existingCategories = await Category.find({});

    console.log(`Found ${existingCategories.length} existing categories`);

    // Convert each existing category to level 1 (category)
    for (const cat of existingCategories) {
      if (!cat.level) {
        await Category.findByIdAndUpdate(cat._id, {
          type: 'category',
          level: 1,
          parent: null
        });
        console.log(`Migrated category: ${cat.name}`);
      }
    }

    console.log('Migration completed successfully');

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateCategories();