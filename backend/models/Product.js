const mongoose = require("mongoose")

const optionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["single", "multiple"],
    default: "single",
  },
  required: { type: Boolean, default: false },
  choices: [
    {
      name: { type: String, required: true },
      price: { type: Number, default: 0 },
      isAvailable: { type: Boolean, default: true },
    },
  ],
})

const nutritionSchema = new mongoose.Schema({
  calories: Number,
  protein: Number, // grams
  carbs: Number, // grams
  fat: Number, // grams
  fiber: Number, // grams
  sugar: Number, // grams
  sodium: Number, // mg
})

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subcategory: String,
    images: [
      {
        url: { type: String, required: true },
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: Number, // for discounts
    currency: {
      type: String,
      default: "ARS",
    },
    options: [optionSchema], // size, extras, etc.
    tags: [String], // spicy, vegetarian, gluten-free, etc.
    ingredients: [String],
    allergens: [String],
    nutrition: nutritionSchema,
    preparationTime: {
      type: Number,
      default: 10, // minutes
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: null, // null means unlimited
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
    totalOrders: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
      },
      value: Number,
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: false },
    },
    seo: {
      slug: String,
      metaTitle: String,
      metaDescription: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
productSchema.index({ store: 1, isAvailable: 1 })
productSchema.index({ category: 1, isAvailable: 1 })
productSchema.index({ "rating.average": -1 })
productSchema.index({ totalOrders: -1 })
productSchema.index({ tags: 1 })
productSchema.index({ name: "text", description: "text" })

// Virtual for discounted price
productSchema.virtual("finalPrice").get(function () {
  if (!this.discount || !this.discount.isActive) return this.price

  const now = new Date()
  if (this.discount.startDate && now < this.discount.startDate) return this.price
  if (this.discount.endDate && now > this.discount.endDate) return this.price

  if (this.discount.type === "percentage") {
    return this.price * (1 - this.discount.value / 100)
  } else {
    return Math.max(0, this.price - this.discount.value)
  }
})

// Check if product is in stock
productSchema.methods.isInStock = function (quantity = 1) {
  if (this.stock === null) return this.isAvailable
  return this.isAvailable && this.stock >= quantity
}

// Update stock
productSchema.methods.updateStock = function (quantity) {
  if (this.stock !== null) {
    this.stock = Math.max(0, this.stock - quantity)
    if (this.stock === 0) {
      this.isAvailable = false
    }
  }
  this.totalOrders += quantity
  return this.save()
}

// Update rating
productSchema.methods.updateRating = function (newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating
  this.rating.count += 1
  this.rating.average = totalRating / this.rating.count
  return this.save()
}

// Generate slug
productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.seo.slug) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }
  next()
})

module.exports = mongoose.model("Product", productSchema)
