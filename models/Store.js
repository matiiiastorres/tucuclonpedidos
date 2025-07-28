const mongoose = require("mongoose")

const operatingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  openTime: String, // "09:00"
  closeTime: String, // "22:00"
  breaks: [
    {
      startTime: String,
      endTime: String,
    },
  ],
})

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      maxlength: [100, "Store name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [
      {
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    logo: String,
    banner: String,
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: String,
      country: { type: String, default: "Argentina" },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    phone: {
      type: String,
      required: true,
    },
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
    },
    operatingHours: [operatingHoursSchema],
    deliveryInfo: {
      deliveryRadius: {
        type: Number,
        default: 5, // km
        min: 0.5,
        max: 50,
      },
      minimumOrder: {
        type: Number,
        default: 0,
      },
      deliveryFee: {
        type: Number,
        default: 2.5,
      },
      freeDeliveryThreshold: Number,
      estimatedDeliveryTime: {
        min: { type: Number, default: 20 },
        max: { type: Number, default: 45 },
      },
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    tags: [String], // fast-food, healthy, vegetarian, etc.
    features: [String], // delivery, pickup, dine-in
    paymentMethods: [
      {
        type: String,
        enum: ["cash", "card", "digital_wallet", "bank_transfer"],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    settings: {
      acceptOrders: { type: Boolean, default: true },
      autoAcceptOrders: { type: Boolean, default: false },
      preparationTime: { type: Number, default: 15 }, // minutes
      maxOrdersPerHour: { type: Number, default: 20 },
    },
  },
  {
    timestamps: true,
  },
)

// Geospatial index for location-based queries
storeSchema.index({ location: "2dsphere" })
storeSchema.index({ category: 1, isActive: 1 })
storeSchema.index({ "rating.average": -1 })
storeSchema.index({ isFeatured: -1, "rating.average": -1 })

// Check if store is currently open
storeSchema.methods.isCurrentlyOpen = function () {
  const now = new Date()
  const currentDay = now.toLocaleLowerCase().substring(0, 3) // mon, tue, etc.
  const currentTime = now.toTimeString().substring(0, 5) // HH:MM

  const todayHours = this.operatingHours.find((hours) => hours.day.startsWith(currentDay))

  if (!todayHours || !todayHours.isOpen) return false

  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime
}

// Calculate distance from a point
storeSchema.methods.distanceFrom = function (coordinates) {
  const [lng, lat] = this.location.coordinates
  const R = 6371 // Earth's radius in km

  const dLat = ((coordinates.lat - lat) * Math.PI) / 180
  const dLng = ((coordinates.lng - lng) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((coordinates.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Update rating
storeSchema.methods.updateRating = function (newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating
  this.rating.count += 1
  this.rating.average = totalRating / this.rating.count
  return this.save()
}

// Check if location is within delivery radius
storeSchema.methods.canDeliverTo = function (coordinates) {
  const distance = this.distanceFrom(coordinates)
  return distance <= this.deliveryInfo.deliveryRadius
}

module.exports = mongoose.model("Store", storeSchema)
