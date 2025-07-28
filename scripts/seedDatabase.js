const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Import models
const User = require("../models/User")

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/delivery-app")
    console.log("MongoDB connected for seeding")
  } catch (error) {
    console.error("Database connection error:", error)
    process.exit(1)
  }
}

// Sample data
const users = [
  {
    name: "Admin Usuario",
    email: "admin@delivery.com",
    password: "password123",
    role: "admin",
    phone: "+5491123456789",
    isActive: true,
    emailVerified: true,
  },
  {
    name: "Juan Pérez",
    email: "client@delivery.com",
    password: "password123",
    role: "client",
    phone: "+5491123456790",
    addresses: [
      {
        label: "Casa",
        street: "Av. Corrientes 1234",
        city: "Buenos Aires",
        state: "CABA",
        zipCode: "1043",
        coordinates: { lat: -34.6037, lng: -58.3816 },
        isDefault: true,
      },
    ],
    loyaltyPoints: 150,
  },
  {
    name: "María García",
    email: "store@delivery.com",
    password: "password123",
    role: "store_owner",
    phone: "+5491123456791",
  },
]

// Seed function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...")

    // Clear existing data
    await User.deleteMany({})
    console.log("✅ Cleared existing data")

    // Hash passwords for users
    for (const user of users) {
      const salt = await bcrypt.genSalt(12)
      user.password = await bcrypt.hash(user.password, salt)
    }

    // Create users
    const createdUsers = await User.insertMany(users)
    console.log(`✅ Created ${createdUsers.length} users`)

    console.log("🎉 Database seeding completed successfully!")
    console.log("\n🔐 Test accounts:")
    console.log("   Admin: admin@delivery.com / password123")
    console.log("   Client: client@delivery.com / password123")
    console.log("   Store Owner: store@delivery.com / password123")
  } catch (error) {
    console.error("❌ Seeding error:", error)
  } finally {
    mongoose.connection.close()
  }
}

// Run seeding
if (require.main === module) {
  connectDB().then(() => {
    seedDatabase()
  })
}

module.exports = { seedDatabase }
