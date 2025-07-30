const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Import models
const User = require('../models/User')
const Store = require('../models/Store')
const Category = require('../models/Category')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Review = require('../models/Review')
const Coupon = require('../models/Coupon')

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

// Sample data
const categories = [
  {
    name: 'Restaurants',
    description: 'Food and dining establishments',
    icon: '🍽️',
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Fast Food',
    description: 'Quick service restaurants',
    icon: '🍔',
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Pizza',
    description: 'Pizza restaurants and delivery',
    icon: '🍕',
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Asian Cuisine',
    description: 'Asian food restaurants',
    icon: '🥡',
    isActive: true,
    sortOrder: 4,
  },
  {
    name: 'Coffee & Desserts',
    description: 'Coffee shops and dessert places',
    icon: '☕',
    isActive: true,
    sortOrder: 5,
  },
  {
    name: 'Groceries',
    description: 'Supermarkets and grocery stores',
    icon: '🛒',
    isActive: true,
    sortOrder: 6,
  },
  {
    name: 'Pharmacy',
    description: 'Pharmacies and health products',
    icon: '💊',
    isActive: true,
    sortOrder: 7,
  },
  {
    name: 'Convenience',
    description: 'Convenience stores and general goods',
    icon: '🏪',
    isActive: true,
    sortOrder: 8,
  },
]

const users = [
  {
    name: 'Admin User',
    email: 'admin@deliveryapp.com',
    password: 'password123',
    role: 'admin',
    isActive: true,
    emailVerified: true,
    addresses: [
      {
        label: 'Home',
        street: '123 Admin Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        isDefault: true,
      },
    ],
    preferences: {
      notifications: { email: true, push: true, sms: false },
      dietary: [],
      language: 'en',
    },
  },
  {
    name: 'Store Owner',
    email: 'store@deliveryapp.com',
    password: 'password123',
    role: 'store_owner',
    isActive: true,
    emailVerified: true,
    addresses: [
      {
        label: 'Business',
        street: '456 Business Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'United States',
        coordinates: { lat: 40.7589, lng: -73.9851 },
        isDefault: true,
      },
    ],
    preferences: {
      notifications: { email: true, push: true, sms: true },
      dietary: [],
      language: 'en',
    },
  },
  {
    name: 'John Customer',
    email: 'customer@deliveryapp.com',
    password: 'password123',
    role: 'client',
    isActive: true,
    emailVerified: true,
    loyaltyPoints: 150,
    addresses: [
      {
        label: 'Home',
        street: '789 Customer Lane',
        city: 'New York',
        state: 'NY',
        zipCode: '10003',
        country: 'United States',
        coordinates: { lat: 40.7505, lng: -73.9934 },
        isDefault: true,
      },
      {
        label: 'Work',
        street: '321 Office Plaza',
        city: 'New York',
        state: 'NY',
        zipCode: '10004',
        country: 'United States',
        coordinates: { lat: 40.7614, lng: -73.9776 },
        isDefault: false,
      },
    ],
    preferences: {
      notifications: { email: true, push: true, sms: false },
      dietary: ['vegetarian'],
      language: 'en',
    },
  },
  {
    name: 'Delivery Driver',
    email: 'driver@deliveryapp.com',
    password: 'password123',
    role: 'delivery_driver',
    isActive: true,
    emailVerified: true,
    addresses: [
      {
        label: 'Home',
        street: '555 Driver Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10005',
        country: 'United States',
        coordinates: { lat: 40.7282, lng: -74.0776 },
        isDefault: true,
      },
    ],
    preferences: {
      notifications: { email: true, push: true, sms: true },
      dietary: [],
      language: 'en',
    },
  },
]

const createStores = (users, categories) => [
  {
    name: "Mario's Italian Kitchen",
    description: 'Authentic Italian cuisine with fresh ingredients and traditional recipes',
    owner: users.find(u => u.role === 'store_owner')._id,
    category: categories.find(c => c.name === 'Restaurants')._id,
    subcategories: ['Italian', 'Pasta', 'Mediterranean'],
    cuisine: ['Italian', 'Mediterranean'],
    location: {
      address: '456 Business Ave, New York, NY 10002',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      deliveryRadius: 15,
    },
    contact: {
      phone: '+1-555-0123',
      email: 'orders@marios.com',
      website: 'https://marios.com',
    },
    businessHours: [
      { day: 'Monday', openTime: '11:00', closeTime: '22:00', isOpen: true },
      { day: 'Tuesday', openTime: '11:00', closeTime: '22:00', isOpen: true },
      { day: 'Wednesday', openTime: '11:00', closeTime: '22:00', isOpen: true },
      { day: 'Thursday', openTime: '11:00', closeTime: '22:00', isOpen: true },
      { day: 'Friday', openTime: '11:00', closeTime: '23:00', isOpen: true },
      { day: 'Saturday', openTime: '11:00', closeTime: '23:00', isOpen: true },
      { day: 'Sunday', openTime: '12:00', closeTime: '21:00', isOpen: true },
    ],
    deliveryInfo: {
      deliveryFee: 3.99,
      freeDeliveryMinOrder: 35.00,
      estimatedDeliveryTime: '30-45 min',
      deliveryAreas: ['Manhattan', 'Brooklyn Heights'],
    },
    averageRating: 4.5,
    totalReviews: 127,
    isActive: true,
    isOpen: true,
    isFeatured: true,
    tags: ['popular', 'fast-delivery', 'family-friendly'],
  },
  {
    name: 'Burger Palace',
    description: 'Gourmet burgers and classic American comfort food',
    owner: users.find(u => u.role === 'store_owner')._id,
    category: categories.find(c => c.name === 'Fast Food')._id,
    subcategories: ['Burgers', 'American', 'Comfort Food'],
    cuisine: ['American', 'Fast Food'],
    location: {
      address: '789 Burger Street, New York, NY 10010',
      coordinates: { lat: 40.7505, lng: -73.9934 },
      deliveryRadius: 12,
    },
    contact: {
      phone: '+1-555-0456',
      email: 'info@burgerpalace.com',
    },
    businessHours: [
      { day: 'Monday', openTime: '10:00', closeTime: '23:00', isOpen: true },
      { day: 'Tuesday', openTime: '10:00', closeTime: '23:00', isOpen: true },
      { day: 'Wednesday', openTime: '10:00', closeTime: '23:00', isOpen: true },
      { day: 'Thursday', openTime: '10:00', closeTime: '23:00', isOpen: true },
      { day: 'Friday', openTime: '10:00', closeTime: '24:00', isOpen: true },
      { day: 'Saturday', openTime: '10:00', closeTime: '24:00', isOpen: true },
      { day: 'Sunday', openTime: '11:00', closeTime: '22:00', isOpen: true },
    ],
    deliveryInfo: {
      deliveryFee: 2.99,
      freeDeliveryMinOrder: 25.00,
      estimatedDeliveryTime: '20-35 min',
      deliveryAreas: ['Manhattan', 'Lower East Side'],
    },
    averageRating: 4.2,
    totalReviews: 89,
    isActive: true,
    isOpen: true,
    isFeatured: false,
    tags: ['quick-delivery', 'affordable'],
  },
  {
    name: 'Fresh Market',
    description: 'Your neighborhood grocery store with fresh produce and everyday essentials',
    owner: users.find(u => u.role === 'store_owner')._id,
    category: categories.find(c => c.name === 'Groceries')._id,
    subcategories: ['Supermarket', 'Fresh Produce', 'Household'],
    cuisine: [],
    location: {
      address: '123 Market Street, New York, NY 10011',
      coordinates: { lat: 40.7400, lng: -74.0000 },
      deliveryRadius: 20,
    },
    contact: {
      phone: '+1-555-0789',
      email: 'help@freshmarket.com',
    },
    businessHours: [
      { day: 'Monday', openTime: '07:00', closeTime: '22:00', isOpen: true },
      { day: 'Tuesday', openTime: '07:00', closeTime: '22:00', isOpen: true },
      { day: 'Wednesday', openTime: '07:00', closeTime: '22:00', isOpen: true },
      { day: 'Thursday', openTime: '07:00', closeTime: '22:00', isOpen: true },
      { day: 'Friday', openTime: '07:00', closeTime: '22:00', isOpen: true },
      { day: 'Saturday', openTime: '08:00', closeTime: '21:00', isOpen: true },
      { day: 'Sunday', openTime: '09:00', closeTime: '20:00', isOpen: true },
    ],
    deliveryInfo: {
      deliveryFee: 4.99,
      freeDeliveryMinOrder: 50.00,
      estimatedDeliveryTime: '45-60 min',
      deliveryAreas: ['Manhattan', 'Brooklyn', 'Queens'],
    },
    averageRating: 4.0,
    totalReviews: 45,
    isActive: true,
    isOpen: true,
    isFeatured: false,
    tags: ['grocery', 'essentials'],
  },
]

const createProducts = (stores, categories) => {
  const italianRestaurant = stores.find(s => s.name === "Mario's Italian Kitchen")
  const burgerPalace = stores.find(s => s.name === 'Burger Palace')
  const freshMarket = stores.find(s => s.name === 'Fresh Market')

  return [
    // Mario's Italian Kitchen Products
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with fresh tomato sauce, mozzarella, and basil',
      price: 18.99,
      images: ['https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500'],
      category: categories.find(c => c.name === 'Pizza')._id,
      store: italianRestaurant._id,
      customizations: [
        {
          name: 'Size',
          type: 'single',
          required: true,
          options: [
            { name: 'Small (10")', price: 0 },
            { name: 'Medium (12")', price: 3.00 },
            { name: 'Large (14")', price: 6.00 },
          ],
        },
        {
          name: 'Crust',
          type: 'single',
          required: false,
          options: [
            { name: 'Thin Crust', price: 0 },
            { name: 'Thick Crust', price: 2.00 },
            { name: 'Stuffed Crust', price: 3.50 },
          ],
        },
      ],
      addons: [
        { name: 'Extra Cheese', price: 2.50 },
        { name: 'Pepperoni', price: 3.00 },
        { name: 'Mushrooms', price: 2.00 },
        { name: 'Olives', price: 2.00 },
      ],
      allergens: ['gluten', 'dairy'],
      dietary: ['vegetarian'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
      prepTime: '15-20 min',
      tags: ['popular', 'classic'],
    },
    {
      name: 'Spaghetti Carbonara',
      description: 'Creamy pasta with bacon, eggs, parmesan cheese, and black pepper',
      price: 16.99,
      images: ['https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=500'],
      category: categories.find(c => c.name === 'Restaurants')._id,
      store: italianRestaurant._id,
      customizations: [
        {
          name: 'Pasta Type',
          type: 'single',
          required: true,
          options: [
            { name: 'Spaghetti', price: 0 },
            { name: 'Fettuccine', price: 1.00 },
            { name: 'Penne', price: 1.00 },
          ],
        },
      ],
      addons: [
        { name: 'Extra Bacon', price: 3.50 },
        { name: 'Grilled Chicken', price: 4.00 },
        { name: 'Garlic Bread', price: 3.99 },
      ],
      allergens: ['gluten', 'dairy', 'eggs'],
      dietary: [],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      prepTime: '18-25 min',
      tags: ['creamy', 'traditional'],
    },
    // Burger Palace Products
    {
      name: 'Classic Cheeseburger',
      description: 'Juicy beef patty with cheese, lettuce, tomato, onion, and special sauce',
      price: 12.99,
      images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'],
      category: categories.find(c => c.name === 'Fast Food')._id,
      store: burgerPalace._id,
      customizations: [
        {
          name: 'Meat',
          type: 'single',
          required: true,
          options: [
            { name: 'Beef Patty', price: 0 },
            { name: 'Double Beef', price: 3.50 },
            { name: 'Chicken Breast', price: 1.00 },
            { name: 'Plant-Based', price: 2.00 },
          ],
        },
        {
          name: 'Cheese',
          type: 'single',
          required: false,
          options: [
            { name: 'American', price: 0 },
            { name: 'Cheddar', price: 0.50 },
            { name: 'Swiss', price: 0.50 },
            { name: 'No Cheese', price: -1.00 },
          ],
        },
      ],
      addons: [
        { name: 'Bacon', price: 2.50 },
        { name: 'Avocado', price: 2.00 },
        { name: 'Extra Patty', price: 4.00 },
        { name: 'Fries', price: 3.99 },
      ],
      allergens: ['gluten', 'dairy'],
      dietary: [],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      prepTime: '12-18 min',
      tags: ['popular', 'classic'],
    },
    {
      name: 'Crispy Chicken Wings',
      description: 'Spicy buffalo wings served with celery and blue cheese dip',
      price: 9.99,
      images: ['https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500'],
      category: categories.find(c => c.name === 'Fast Food')._id,
      store: burgerPalace._id,
      customizations: [
        {
          name: 'Quantity',
          type: 'single',
          required: true,
          options: [
            { name: '6 Wings', price: 0 },
            { name: '12 Wings', price: 4.99 },
            { name: '18 Wings', price: 8.99 },
          ],
        },
        {
          name: 'Sauce',
          type: 'single',
          required: true,
          options: [
            { name: 'Buffalo', price: 0 },
            { name: 'BBQ', price: 0 },
            { name: 'Honey Garlic', price: 0 },
            { name: 'Plain', price: 0 },
          ],
        },
      ],
      addons: [
        { name: 'Extra Sauce', price: 0.50 },
        { name: 'Ranch Dip', price: 1.00 },
        { name: 'Celery Sticks', price: 1.50 },
      ],
      allergens: ['dairy'],
      dietary: [],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: true,
      prepTime: '15-20 min',
      tags: ['spicy', 'finger-food'],
    },
    // Fresh Market Products
    {
      name: 'Organic Bananas',
      description: 'Fresh organic bananas, perfect for snacking or smoothies',
      price: 2.99,
      images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500'],
      category: categories.find(c => c.name === 'Groceries')._id,
      store: freshMarket._id,
      customizations: [],
      addons: [],
      allergens: [],
      dietary: ['vegan', 'organic'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      prepTime: 'N/A',
      tags: ['fresh', 'healthy', 'organic'],
    },
    {
      name: 'Whole Milk',
      description: '1 gallon of fresh whole milk from local farms',
      price: 4.49,
      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500'],
      category: categories.find(c => c.name === 'Groceries')._id,
      store: freshMarket._id,
      customizations: [
        {
          name: 'Type',
          type: 'single',
          required: true,
          options: [
            { name: 'Whole Milk', price: 0 },
            { name: '2% Milk', price: 0 },
            { name: 'Skim Milk', price: 0 },
            { name: 'Almond Milk', price: 1.50 },
          ],
        },
      ],
      addons: [],
      allergens: ['dairy'],
      dietary: ['vegetarian'],
      isAvailable: true,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      prepTime: 'N/A',
      tags: ['dairy', 'essential'],
    },
  ]
}

const createCoupons = (stores, categories) => [
  {
    code: 'WELCOME20',
    title: 'Welcome Discount',
    description: '20% off your first order',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 10.00,
    minOrderAmount: 25.00,
    maxUsage: 1000,
    maxUsagePerUser: 1,
    usageCount: 45,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    applicableStores: [],
    applicableCategories: [],
    eligibleUsers: [],
    newUsersOnly: true,
    isActive: true,
    createdBy: null, // Will be set to admin user
  },
  {
    code: 'FREESHIP',
    title: 'Free Delivery',
    description: 'Free delivery on any order',
    discountType: 'freeDelivery',
    discountValue: 0,
    minOrderAmount: 30.00,
    maxUsage: null,
    maxUsagePerUser: 3,
    usageCount: 123,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    applicableStores: [],
    applicableCategories: [],
    eligibleUsers: [],
    newUsersOnly: false,
    isActive: true,
    createdBy: null, // Will be set to admin user
  },
]

// Clear existing data
const clearDatabase = async () => {
  console.log('Clearing existing data...')
  await User.deleteMany({})
  await Store.deleteMany({})
  await Category.deleteMany({})
  await Product.deleteMany({})
  await Order.deleteMany({})
  await Review.deleteMany({})
  await Coupon.deleteMany({})
  console.log('Database cleared')
}

// Seed data
const seedDatabase = async () => {
  try {
    await connectDB()
    await clearDatabase()

    console.log('Seeding database...')

    // Hash passwords for users
    for (let user of users) {
      user.password = await bcrypt.hash(user.password, 12)
    }

    // Create categories
    console.log('Creating categories...')
    const createdCategories = await Category.insertMany(categories)
    console.log(`✅ Created ${createdCategories.length} categories`)

    // Create users
    console.log('Creating users...')
    const createdUsers = await User.insertMany(users)
    console.log(`✅ Created ${createdUsers.length} users`)

    // Create stores
    console.log('Creating stores...')
    const storeData = createStores(createdUsers, createdCategories)
    const createdStores = await Store.insertMany(storeData)
    console.log(`✅ Created ${createdStores.length} stores`)

    // Create products
    console.log('Creating products...')
    const productData = createProducts(createdStores, createdCategories)
    const createdProducts = await Product.insertMany(productData)
    console.log(`✅ Created ${createdProducts.length} products`)

    // Create coupons
    console.log('Creating coupons...')
    const couponData = createCoupons(createdStores, createdCategories)
    const adminUser = createdUsers.find(u => u.role === 'admin')
    couponData.forEach(coupon => {
      coupon.createdBy = adminUser._id
    })
    const createdCoupons = await Coupon.insertMany(couponData)
    console.log(`✅ Created ${createdCoupons.length} coupons`)

    console.log('\n🎉 Database seeded successfully!')
    console.log('\nTest accounts:')
    console.log('Admin: admin@deliveryapp.com / password123')
    console.log('Store Owner: store@deliveryapp.com / password123')
    console.log('Customer: customer@deliveryapp.com / password123')
    console.log('Driver: driver@deliveryapp.com / password123')

  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    mongoose.connection.close()
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase()
}

module.exports = seedDatabase
