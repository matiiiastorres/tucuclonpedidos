const mongoose = require("mongoose")

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  customizations: [
    {
      name: String,
      options: [String],
      price: { type: Number, default: 0 },
    },
  ],
  addons: [
    {
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 },
    },
  ],
  specialInstructions: {
    type: String,
    maxlength: [200, "Special instructions cannot be more than 200 characters"],
  },
  price: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
})

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    items: [cartItemSchema],
    
    // Totals
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    
    // Applied coupon
    appliedCoupon: {
      code: String,
      discountAmount: Number,
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
    },
    
    // Delivery details
    deliveryAddress: {
      label: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      instructions: String,
    },
    
    // Timing
    scheduledDelivery: {
      date: Date,
      timeSlot: String, // "ASAP", "12:00-12:30", etc.
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Expiration (carts expire after 24 hours of inactivity)
    expiresAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours in seconds
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
cartSchema.index({ user: 1, store: 1 }, { unique: true })
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Update expiration on each modification
cartSchema.pre("save", function (next) {
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  next()
})

// Calculate totals before saving
cartSchema.pre("save", function (next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0)
  
  // Calculate tax (assuming 10% tax rate, should be configurable)
  this.tax = Math.round(this.subtotal * 0.1 * 100) / 100
  
  // Service fee (small percentage, should be configurable)
  this.serviceFee = Math.round(this.subtotal * 0.02 * 100) / 100
  
  // Calculate total
  this.total = this.subtotal + this.tax + this.deliveryFee + this.serviceFee - this.discount
  this.total = Math.round(this.total * 100) / 100
  
  next()
})

// Method to add item to cart
cartSchema.methods.addItem = function (productData) {
  const existingItemIndex = this.items.findIndex(
    (item) => 
      item.product.toString() === productData.product.toString() &&
      JSON.stringify(item.customizations) === JSON.stringify(productData.customizations) &&
      JSON.stringify(item.addons) === JSON.stringify(productData.addons)
  )

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += productData.quantity
    this.items[existingItemIndex].totalPrice = 
      this.items[existingItemIndex].price * this.items[existingItemIndex].quantity
  } else {
    // Add new item
    this.items.push(productData)
  }

  return this.save()
}

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function (itemId, quantity) {
  const item = this.items.id(itemId)
  if (!item) {
    throw new Error("Item not found in cart")
  }

  if (quantity <= 0) {
    this.items.pull(itemId)
  } else {
    item.quantity = quantity
    item.totalPrice = item.price * quantity
  }

  return this.save()
}

// Method to remove item
cartSchema.methods.removeItem = function (itemId) {
  this.items.pull(itemId)
  return this.save()
}

// Method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = []
  this.appliedCoupon = undefined
  this.discount = 0
  return this.save()
}

// Method to apply coupon
cartSchema.methods.applyCoupon = function (coupon, discountAmount) {
  this.appliedCoupon = {
    code: coupon.code,
    discountAmount: discountAmount,
    couponId: coupon._id,
  }
  this.discount = discountAmount
  return this.save()
}

// Method to remove coupon
cartSchema.methods.removeCoupon = function () {
  this.appliedCoupon = undefined
  this.discount = 0
  return this.save()
}

// Static method to get or create cart for user and store
cartSchema.statics.getOrCreateCart = async function (userId, storeId) {
  let cart = await this.findOne({ user: userId, store: storeId, isActive: true })
    .populate("items.product")
    .populate("store")

  if (!cart) {
    cart = new this({
      user: userId,
      store: storeId,
      items: [],
    })
    await cart.save()
    cart = await this.findById(cart._id)
      .populate("items.product")
      .populate("store")
  }

  return cart
}

module.exports = mongoose.model("Cart", cartSchema)