const mongoose = require('mongoose');
const User = require('./models/User');
const Chat = require('./models/Chat');
require('dotenv').config();

// Migration script to create Chat documents for existing users who don't have one

const migrateChats = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    });
    console.log('Database Connected');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let created = 0;
    let existing = 0;

    // Check each user and create Chat document if it doesn't exist
    for (const user of users) {
      const chatExists = await Chat.findOne({ user: user._id });
      
      if (!chatExists) {
        await new Chat({
          user: user._id,
          chats: [],
        }).save();
        created++;
        console.log(`Created Chat document for user: ${user.name} (${user.email})`);
      } else {
        existing++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Chat documents created: ${created}`);
    console.log(`Chat documents already existed: ${existing}`);
    console.log(`Total users: ${users.length}`);

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrateChats();






