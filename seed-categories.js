const mongoose = require('mongoose');
const Category = require('./models/Category');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://wangaimoses003:VtiH3XouRpE2WsY3@ac-cgnexfs-shard-00-01.mnywoyb.mongodb.net:27017,ac-cgnexfs-shard-00-02.mnywoyb.mongodb.net:27017,ac-cgnexfs-shard-00-00.mnywoyb.mongodb.net:27017/?authSource=admin&replicaSet=atlas-t2waa8-shard-0&appName=AzixFusion&ssl=true', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
};

// Complete hierarchical category data based on user specifications
const categoryData = [
  {
    name: 'Goods',
    type: 'category',
    subcategories: [
      {
        name: 'Retail & Consumer Goods',
        type: 'subcategory',
        elements: [
          // Groceries elements
          { name: 'Fresh produce', type: 'element' },
          { name: 'Dairy products', type: 'element' },
          { name: 'Packaged foods', type: 'element' },
          { name: 'Beverages', type: 'element' },
          { name: 'Snacks', type: 'element' },
          { name: 'Frozen foods', type: 'element' },
          { name: 'Spices & condiments', type: 'element' },
          // Clothing & Apparel elements
          { name: 'Men\'s fashion', type: 'element' },
          { name: 'Women\'s fashion', type: 'element' },
          { name: 'Children\'s wear', type: 'element' },
          { name: 'Footwear', type: 'element' },
          { name: 'Accessories (belts, bags, hats)', type: 'element' },
          // Electronics & Gadgets elements
          { name: 'Smartphones', type: 'element' },
          { name: 'Laptops', type: 'element' },
          { name: 'Tablets', type: 'element' },
          { name: 'Home entertainment', type: 'element' },
          { name: 'Gaming consoles', type: 'element' },
          { name: 'Accessories (chargers, cases, headphones)', type: 'element' },
          // Home Appliances elements
          { name: 'Kitchen appliances', type: 'element' },
          { name: 'Laundry machines', type: 'element' },
          { name: 'Air conditioners', type: 'element' },
          { name: 'Refrigerators', type: 'element' },
          { name: 'Smart home devices', type: 'element' },
          // Beauty & Personal Care elements
          { name: 'Skincare', type: 'element' },
          { name: 'Hair care', type: 'element' },
          { name: 'Grooming tools', type: 'element' },
          { name: 'Cosmetics', type: 'element' },
          { name: 'Perfumes', type: 'element' },
          { name: 'Hygiene products', type: 'element' },
          // Health & Wellness elements
          { name: 'Supplements', type: 'element' },
          { name: 'Vitamins', type: 'element' },
          { name: 'Medical devices', type: 'element' },
          { name: 'Fitness equipment', type: 'element' },
          { name: 'Alternative medicine', type: 'element' }
        ]
      },
      {
        name: 'Agriculture',
        type: 'subcategory',
        elements: [
          // Fresh Produce elements
          { name: 'Fruits', type: 'element' },
          { name: 'Vegetables', type: 'element' },
          { name: 'Grains', type: 'element' },
          { name: 'Herbs', type: 'element' },
          { name: 'Organic produce', type: 'element' },
          // Livestock & Poultry elements
          { name: 'Cattle', type: 'element' },
          { name: 'Sheep', type: 'element' },
          { name: 'Goats', type: 'element' },
          { name: 'Chickens', type: 'element' },
          { name: 'Eggs', type: 'element' },
          { name: 'Dairy products', type: 'element' },
          { name: 'Beekeeping & honey production', type: 'element' },
          // Farming Tools & Equipment elements
          { name: 'Tractors', type: 'element' },
          { name: 'Irrigation systems', type: 'element' },
          { name: 'Hand tools', type: 'element' },
          { name: 'Greenhouses', type: 'element' },
          { name: 'Storage silos', type: 'element' },
          // Fertilizers & Pesticides elements
          { name: 'Organic fertilizers', type: 'element' },
          { name: 'Chemical fertilizers', type: 'element' },
          { name: 'Pest control products', type: 'element' },
          { name: 'Soil enhancers', type: 'element' },
          // Seeds & Nurseries elements
          { name: 'Crop seeds', type: 'element' },
          { name: 'Saplings', type: 'element' },
          { name: 'Indoor gardening supplies', type: 'element' },
          { name: 'Hydroponics', type: 'element' }
        ]
      },
      {
        name: 'Artisanal & Handicrafts',
        type: 'subcategory',
        elements: [
          // Jewelry elements
          { name: 'Handmade necklaces', type: 'element' },
          { name: 'Bracelets', type: 'element' },
          { name: 'Rings', type: 'element' },
          { name: 'Earrings', type: 'element' },
          { name: 'Beaded accessories', type: 'element' },
          // Textiles & Fashion elements
          { name: 'Traditional clothing', type: 'element' },
          { name: 'Scarves', type: 'element' },
          { name: 'Woven fabrics', type: 'element' },
          { name: 'Hand-dyed textiles', type: 'element' },
          { name: 'Leather goods', type: 'element' },
          // Pottery & Ceramics elements
          { name: 'Decorative pottery', type: 'element' },
          { name: 'Tableware', type: 'element' },
          { name: 'Sculptures', type: 'element' },
          { name: 'Clay home decor', type: 'element' },
          // Cultural Artifacts & Home Decor elements
          { name: 'African masks', type: 'element' },
          { name: 'Wooden carvings', type: 'element' },
          { name: 'Paintings', type: 'element' },
          { name: 'Tapestries', type: 'element' },
          { name: 'Woven baskets', type: 'element' },
          // Handmade Furniture elements
          { name: 'Wooden chairs', type: 'element' },
          { name: 'Tables', type: 'element' },
          { name: 'Beds', type: 'element' },
          { name: 'Handcrafted shelving units', type: 'element' }
        ]
      },
      {
        name: 'Food & Beverage',
        type: 'subcategory',
        elements: [
          // Local Food Vendors elements
          { name: 'Street food', type: 'element' },
          { name: 'Traditional dishes', type: 'element' },
          { name: 'Catering services', type: 'element' },
          { name: 'Fast food outlets', type: 'element' },
          // Bakeries & Confectionery elements
          { name: 'Cakes', type: 'element' },
          { name: 'Bread', type: 'element' },
          { name: 'Pastries', type: 'element' },
          { name: 'Sweets', type: 'element' },
          { name: 'Biscuits', type: 'element' },
          { name: 'Chocolates', type: 'element' },
          // Beverage Suppliers elements
          { name: 'Tea', type: 'element' },
          { name: 'Coffee', type: 'element' },
          { name: 'Juice', type: 'element' },
          { name: 'Soft drinks', type: 'element' },
          { name: 'Alcoholic beverages', type: 'element' },
          { name: 'Energy drinks', type: 'element' },
          // Packaged & Processed Foods elements
          { name: 'Canned goods', type: 'element' },
          { name: 'Frozen meals', type: 'element' },
          { name: 'Snacks', type: 'element' },
          { name: 'Sauces & condiments', type: 'element' },
          // Organic & Specialty Foods elements
          { name: 'Gluten-free', type: 'element' },
          { name: 'Vegan', type: 'element' },
          { name: 'Keto-friendly products', type: 'element' }
        ]
      },
      {
        name: 'Construction & Building Materials',
        type: 'subcategory',
        elements: [
          // Raw Materials elements
          { name: 'Sand', type: 'element' },
          { name: 'Gravel', type: 'element' },
          { name: 'Cement', type: 'element' },
          { name: 'Bricks', type: 'element' },
          { name: 'Tiles', type: 'element' },
          { name: 'Limestone', type: 'element' },
          // Structural Components elements
          { name: 'Roofing sheets', type: 'element' },
          { name: 'Steel rods', type: 'element' },
          { name: 'Timber', type: 'element' },
          { name: 'Insulation', type: 'element' },
          { name: 'Prefabricated structures', type: 'element' },
          // Finishing Materials elements
          { name: 'Paint', type: 'element' },
          { name: 'Adhesives', type: 'element' },
          { name: 'Flooring', type: 'element' },
          { name: 'Doors & windows', type: 'element' },
          { name: 'Plumbing fixtures', type: 'element' },
          // Construction Tools & Equipment elements
          { name: 'Power tools', type: 'element' },
          { name: 'Hand tools', type: 'element' },
          { name: 'Scaffolding', type: 'element' },
          { name: 'Safety gear', type: 'element' },
          { name: 'Heavy machinery rentals', type: 'element' }
        ]
      },
      {
        name: 'Education & Learning',
        type: 'subcategory',
        elements: [
          // School Supplies elements
          { name: 'Books', type: 'element' },
          { name: 'Stationery', type: 'element' },
          { name: 'Backpacks', type: 'element' },
          { name: 'Uniforms', type: 'element' },
          { name: 'Educational toys', type: 'element' },
          // Libraries & Bookstores elements
          { name: 'Textbooks', type: 'element' },
          { name: 'E-books', type: 'element' },
          { name: 'Novels', type: 'element' },
          { name: 'Research materials', type: 'element' }
        ]
      },
      {
        name: 'Automotive & Transportation',
        type: 'subcategory',
        elements: [
          // Vehicles & Motorcycles elements
          { name: 'New & used cars', type: 'element' },
          { name: 'Motorcycles', type: 'element' },
          { name: 'Scooters', type: 'element' },
          { name: 'Electric vehicles', type: 'element' },
          // Auto Parts & Accessories elements
          { name: 'Batteries', type: 'element' },
          { name: 'Tires', type: 'element' },
          { name: 'Car audio systems', type: 'element' },
          { name: 'GPS', type: 'element' },
          { name: 'Car maintenance tools', type: 'element' }
        ]
      },
      {
        name: 'Technology & Software',
        type: 'subcategory',
        elements: [
          // Computers & Accessories elements
          { name: 'Laptops', type: 'element' },
          { name: 'Desktops', type: 'element' },
          { name: 'Storage devices', type: 'element' },
          { name: 'Networking equipment', type: 'element' },
          // Software & Digital Solutions elements
          { name: 'Business software', type: 'element' },
          { name: 'Antivirus', type: 'element' },
          { name: 'Design software', type: 'element' },
          { name: 'Cloud solutions', type: 'element' }
        ]
      }
    ]
  },
  {
    name: 'Services',
    type: 'category',
    subcategories: [
      {
        name: 'Home Services',
        type: 'subcategory',
        elements: [
          { name: 'Plumbing', type: 'element' },
          { name: 'Electrical work', type: 'element' },
          { name: 'Carpentry', type: 'element' },
          { name: 'Cleaning services', type: 'element' },
          { name: 'Painting', type: 'element' }
        ]
      },
      {
        name: 'Transportation & Logistics',
        type: 'subcategory',
        elements: [
          { name: 'Ridesharing (Uber, Bolt)', type: 'element' },
          { name: 'Private taxi services', type: 'element' },
          { name: 'Courier services', type: 'element' },
          { name: 'Delivery services', type: 'element' },
          { name: 'Moving & relocation', type: 'element' },
          { name: 'Airport transfers', type: 'element' },
          { name: 'Car rentals', type: 'element' },
          { name: 'Heavy-duty vehicle rentals', type: 'element' },
          { name: 'Vehicle leasing options', type: 'element' },
          { name: 'Intercity bus services', type: 'element' }
        ]
      },
      {
        name: 'Freelance & Digital Services',
        type: 'subcategory',
        elements: [
          { name: 'Graphic design', type: 'element' },
          { name: 'Web development', type: 'element' },
          { name: 'Writing', type: 'element' },
          { name: 'Social media management', type: 'element' },
          { name: 'Translation services', type: 'element' }
        ]
      },
      {
        name: 'Event Services',
        type: 'subcategory',
        elements: [
          { name: 'Catering', type: 'element' },
          { name: 'Photography', type: 'element' },
          { name: 'Videography', type: 'element' },
          { name: 'Event planning', type: 'element' },
          { name: 'Music & DJ services', type: 'element' }
        ]
      },
      {
        name: 'Health & Wellness Services',
        type: 'subcategory',
        elements: [
          { name: 'Personal training', type: 'element' },
          { name: 'Yoga instructors', type: 'element' },
          { name: 'Massage therapy', type: 'element' },
          { name: 'Diet & nutrition consulting', type: 'element' }
        ]
      },
      {
        name: 'Professional Services',
        type: 'subcategory',
        elements: [
          { name: 'Contractors', type: 'element' },
          { name: 'Engineers', type: 'element' },
          { name: 'Architects', type: 'element' },
          { name: 'Interior designers', type: 'element' }
        ]
      },
      {
        name: 'Tutoring & Private Lessons',
        type: 'subcategory',
        elements: [
          { name: 'Math', type: 'element' },
          { name: 'Science', type: 'element' },
          { name: 'Language tutoring', type: 'element' },
          { name: 'Test prep', type: 'element' },
          { name: 'Music lessons', type: 'element' }
        ]
      },
      {
        name: 'Vocational & Skill Training',
        type: 'subcategory',
        elements: [
          { name: 'Coding bootcamps', type: 'element' },
          { name: 'Artisan workshops', type: 'element' },
          { name: 'Farming techniques', type: 'element' },
          { name: 'Fashion design courses', type: 'element' }
        ]
      },
      {
        name: 'Online & E-Learning Platforms',
        type: 'subcategory',
        elements: [
          { name: 'Digital courses', type: 'element' },
          { name: 'Educational apps', type: 'element' },
          { name: 'Virtual training', type: 'element' },
          { name: 'Corporate training programs', type: 'element' }
        ]
      },
      {
        name: 'Tech Services & Repairs',
        type: 'subcategory',
        elements: [
          { name: 'IT support', type: 'element' },
          { name: 'Gadget repair', type: 'element' },
          { name: 'Cybersecurity consulting', type: 'element' }
        ]
      },
      {
        name: 'Banking & Financial Services',
        type: 'subcategory',
        elements: [
          { name: 'Loans', type: 'element' },
          { name: 'Insurance', type: 'element' },
          { name: 'Savings accounts', type: 'element' },
          { name: 'Mobile money services', type: 'element' }
        ]
      },
      {
        name: 'Business Consulting & Legal Services',
        type: 'subcategory',
        elements: [
          { name: 'Business registration', type: 'element' },
          { name: 'Tax consulting', type: 'element' },
          { name: 'Trademark registration', type: 'element' },
          { name: 'Accounting services', type: 'element' }
        ]
      },
      {
        name: 'Hotels & Accommodations',
        type: 'subcategory',
        elements: [
          { name: 'Hotels', type: 'element' },
          { name: 'Guest houses', type: 'element' },
          { name: 'Airbnb rentals', type: 'element' }
        ]
      },
      {
        name: 'Travel Agencies & Tour Operators',
        type: 'subcategory',
        elements: [
          { name: 'Safari tours', type: 'element' },
          { name: 'Flight bookings', type: 'element' },
          { name: 'Vacation planning', type: 'element' }
        ]
      }
    ]
  },
  {
    name: 'Live Bidding Hub',
    type: 'category',
    subcategories: [
      {
        name: 'Music & Media',
        type: 'subcategory',
        elements: [
          { name: 'Afrobeat, Amapiano, Cultural Sounds', type: 'element' },
          { name: 'Royalty-Free Beats & Instrumentals', type: 'element' },
          { name: 'Voiceovers & Jingles', type: 'element' }
        ]
      },
      {
        name: 'Apps',
        type: 'subcategory',
        elements: [
          { name: 'African-Themed Games', type: 'element' },
          { name: 'Utility & Culture-Based Apps', type: 'element' }
        ]
      },
      {
        name: 'Event Access',
        type: 'subcategory',
        elements: [
          { name: 'Concerts & Festivals', type: 'element' },
          { name: 'Sports & Competitions', type: 'element' },
          { name: 'Art & Cultural Events', type: 'element' }
        ]
      },
      {
        name: 'Art & Design',
        type: 'subcategory',
        elements: [
          { name: 'Logos & Brand Design', type: 'element' },
          { name: 'Photos & Animation', type: 'element' },
          { name: 'Oil on Canvas', type: 'element' },
          { name: 'Surreal & Cultural Art', type: 'element' },
          { name: 'Artworks', type: 'element' }
        ]
      },
      {
        name: 'Advertising Content',
        type: 'subcategory',
        elements: [
          { name: 'Promo Videos', type: 'element' },
          { name: 'Marketing Scripts & Concepts', type: 'element' }
        ]
      },
      {
        name: 'Vintage & Antiques',
        type: 'subcategory',
        elements: [
          { name: 'Historical Artifacts', type: 'element' },
          { name: 'Collector\'s Items', type: 'element' }
        ]
      },
      {
        name: 'Travel Vouchers',
        type: 'subcategory',
        elements: [
          { name: 'Cultural Heritage Tours', type: 'element' },
          { name: 'Safari & Nature Adventures', type: 'element' },
          { name: 'Island & Beach Getaways', type: 'element' },
          { name: 'City Escapes & Urban Experiences', type: 'element' },
          { name: 'Health & Wellness Retreats', type: 'element' },
          { name: 'Romantic & Honeymoon Escapes', type: 'element' },
          { name: 'Family-Friendly Packages', type: 'element' },
          { name: 'Business & Luxury Travel', type: 'element' },
          { name: 'Eco & Agro-Tourism', type: 'element' }
        ]
      }
    ]
  },
  {
    name: 'Local Experience Hosts',
    type: 'category',
    subcategories: [
      {
        name: 'City Life & Urban Tours',
        type: 'subcategory',
        elements: [
          { name: 'Walkthroughs of neighborhoods', type: 'element' },
          { name: 'Nightlife', type: 'element' },
          { name: 'Historical sites', type: 'element' },
          { name: 'Food crawls', type: 'element' }
        ]
      },
      {
        name: 'Cultural Craft & Market Walks',
        type: 'subcategory',
        elements: [
          { name: 'Explore artisan markets', type: 'element' },
          { name: 'Handmade goods', type: 'element' },
          { name: 'Traditional art & craft', type: 'element' }
        ]
      },
      {
        name: 'Eco & Adventure Tourism',
        type: 'subcategory',
        elements: [
          { name: 'Caves', type: 'element' },
          { name: 'Natural parks', type: 'element' },
          { name: 'Scenic hikes', type: 'element' },
          { name: 'Outdoor adventures', type: 'element' }
        ]
      },
      {
        name: 'Forest Trails & Waterfall Hikes',
        type: 'subcategory',
        elements: [
          { name: 'Guided walks through forests', type: 'element' },
          { name: 'Nature treks', type: 'element' },
          { name: 'Hidden waterfalls', type: 'element' }
        ]
      },
      {
        name: 'Mountain & Highland Explorations',
        type: 'subcategory',
        elements: [
          { name: 'Hiking', type: 'element' },
          { name: 'Climbing', type: 'element' },
          { name: 'Nature photography in elevated terrain', type: 'element' }
        ]
      },
      {
        name: 'Wildlife Encounters & Safaris',
        type: 'subcategory',
        elements: [
          { name: 'Game reserves', type: 'element' },
          { name: 'Birdwatching', type: 'element' },
          { name: 'Community-managed animal sanctuaries', type: 'element' }
        ]
      },
      {
        name: 'Hands-On Cultural Experiences',
        type: 'subcategory',
        elements: [
          { name: 'Cooking local food', type: 'element' },
          { name: 'Language immersion', type: 'element' },
          { name: 'Dance', type: 'element' },
          { name: 'Drumming', type: 'element' },
          { name: 'Storytelling', type: 'element' }
        ]
      },
      {
        name: 'Balloon & Aerial View Experiences',
        type: 'subcategory',
        elements: [
          { name: 'Hot air balloon rides', type: 'element' },
          { name: 'Aerial drone-view tours', type: 'element' },
          { name: 'Paragliding', type: 'element' }
        ]
      },
      {
        name: 'Water-Based Adventures',
        type: 'subcategory',
        elements: [
          { name: 'Boat cruises', type: 'element' },
          { name: 'Fishing tours', type: 'element' },
          { name: 'Lakeside retreats', type: 'element' }
        ]
      },
      {
        name: 'Horseback & Offbeat Riding Tours',
        type: 'subcategory',
        elements: [
          { name: 'Rural exploration via horse', type: 'element' },
          { name: 'Camel', type: 'element' },
          { name: 'Motorbike', type: 'element' }
        ]
      },
      {
        name: 'Agro & Farm Stay Experiences',
        type: 'subcategory',
        elements: [
          { name: 'Learn farming', type: 'element' },
          { name: 'Sustainable agriculture', type: 'element' },
          { name: 'Rural life', type: 'element' }
        ]
      }
    ]
  },
  {
    name: 'African Exports & Global Trade',
    type: 'category',
    subcategories: [
      {
        name: 'Agri-Bulk & Food Exports',
        type: 'subcategory',
        elements: [
          { name: 'Fresh Produce', type: 'element' },
          { name: 'Grains', type: 'element' },
          { name: 'Nuts', type: 'element' },
          { name: 'Coffee', type: 'element' },
          { name: 'Tea', type: 'element' },
          { name: 'Cocoa', type: 'element' },
          { name: 'Flowers', type: 'element' },
          { name: 'Processed Foods', type: 'element' }
        ]
      },
      {
        name: 'Textiles & Apparel',
        type: 'subcategory',
        elements: [
          { name: 'African Fabrics & Clothing', type: 'element' },
          { name: 'Tailored Fashion & Uniforms', type: 'element' }
        ]
      },
      {
        name: 'Manufacturing & Industrial Supplies',
        type: 'subcategory',
        elements: [
          { name: 'Machinery & Equipment', type: 'element' },
          { name: 'Tools', type: 'element' },
          { name: 'Steel', type: 'element' },
          { name: 'Industrial Parts', type: 'element' }
        ]
      },
      {
        name: 'Technology & ICT',
        type: 'subcategory',
        elements: [
          { name: 'Electronics & Devices', type: 'element' },
          { name: 'Software Solutions', type: 'element' },
          { name: 'Telecom Infrastructure', type: 'element' }
        ]
      },
      {
        name: 'Energy & Renewables',
        type: 'subcategory',
        elements: [
          { name: 'Solar & Wind Equipment', type: 'element' },
          { name: 'Batteries & Energy Storage', type: 'element' },
          { name: 'Biofuels & Green Energy', type: 'element' }
        ]
      },
      {
        name: 'Healthcare & Pharma',
        type: 'subcategory',
        elements: [
          { name: 'Medical Equipment', type: 'element' },
          { name: 'Generic Drugs & Vaccines', type: 'element' },
          { name: 'Wellness Products', type: 'element' }
        ]
      },
      {
        name: 'Real Estate & Infrastructure',
        type: 'subcategory',
        elements: [
          { name: 'Commercial Land & Properties', type: 'element' },
          { name: 'Industrial Sites', type: 'element' },
          { name: 'Urban Development Projects', type: 'element' }
        ]
      },
      {
        name: 'Mining & Natural Resources',
        type: 'subcategory',
        elements: [
          { name: 'Gold', type: 'element' },
          { name: 'Diamonds', type: 'element' },
          { name: 'Rare Minerals', type: 'element' },
          { name: 'Industrial Metals', type: 'element' }
        ]
      }
    ]
  }
];

// Seed function
const seedCategories = async () => {
  try {
    console.log('Starting category seeding...');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Create categories, subcategories, and elements
    for (const categoryDataItem of categoryData) {
      console.log(`Creating category: ${categoryDataItem.name}`);

      // Create the main category
      const category = new Category({
        name: categoryDataItem.name,
        type: categoryDataItem.type,
        level: 1,
        parent: null
      });
      const savedCategory = await category.save();

      // Create subcategories
      for (const subcategoryData of categoryDataItem.subcategories) {
        console.log(`  Creating subcategory: ${subcategoryData.name}`);

        const subcategory = new Category({
          name: subcategoryData.name,
          type: subcategoryData.type,
          level: 2,
          parent: savedCategory._id
        });
        const savedSubcategory = await subcategory.save();

        // Create elements
        for (const elementData of subcategoryData.elements) {
          console.log(`    Creating element: ${elementData.name}`);

          const element = new Category({
            name: elementData.name,
            type: elementData.type,
            level: 3,
            parent: savedSubcategory._id
          });
          await element.save();
        }
      }
    }

    console.log('Category seeding completed successfully!');
    console.log('Total categories created:', await Category.countDocuments({ type: 'category' }));
    console.log('Total subcategories created:', await Category.countDocuments({ type: 'subcategory' }));
    console.log('Total elements created:', await Category.countDocuments({ type: 'element' }));

  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

// Run the seed function
connectDB().then(() => {
  seedCategories();
});