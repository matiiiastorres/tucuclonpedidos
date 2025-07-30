const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  options: [
    {
      name: String,
      choice: String,
      price: Number,
    },
  ],
  specialInstructions: String,
})

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: [
        "pending", // Order placed, waiting for store confirmation
        "confirmed", // Store confirmed the order
        "preparing", // Store is preparing the order
        "ready", // Order is ready for pickup/delivery
        "on_way", // Driver picked up the order
        "delivered", // Order delivered successfully
        "cancelled", // Order cancelled
        "refunded", // Order refunded
      ],
      default: "pending",
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: String,
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      instructions: String,
    },
    contactInfo: {
      phone: { type: String, required: true },
      email: String,
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ["cash", "card", "digital_wallet"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
    },
    pricing: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    coupon: {
      code: String,
      discount: Number,
      type: { type: String, enum: ["percentage", "fixed"] },
    },
    timing: {
      estimatedPreparation: Number, // minutes
      estimatedDelivery: Number, // minutes
      requestedDeliveryTime: Date,
      confirmedAt: Date,
      preparedAt: Date,
      pickedUpAt: Date,
      deliveredAt: Date,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    driverLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    rating: {
      food: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
      overall: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: Date,
    },
    notes: String,
    specialInstructions: String,
    cancellationReason: String,
    refundAmount: Number,
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsUsed: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

// Indexes
orderSchema.index({ customer: 1, createdAt: -1 })
orderSchema.index({ store: 1, status: 1, createdAt: -1 })
orderSchema.index({ driver: 1, status: 1 })
orderSchema.index({ orderNumber: 1 })
orderSchema.index({ status: 1, createdAt: -1 })

// Generate order number
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments()
    this.orderNumber = `ORD${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(3, "0")}`
  }
  next()
})

// Calculate loyalty points earned
orderSchema.methods.calculateLoyaltyPoints = function () {
  // 1 point per $10 spent
  return Math.floor(this.pricing.total / 10)
}

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function () {
  return ["pending", "confirmed"].includes(this.status)
}

// Check if order can be rated
orderSchema.methods.canBeRated = function () {
  return this.status === "delivered" && !this.rating.overall
}

// Update status with timestamp
orderSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus

  const now = new Date()
  switch (newStatus) {
    case "confirmed":
      this.timing.confirmedAt = now
      break
    case "ready":
      this.timing.preparedAt = now
      break
    case "on_way":
      this.timing.pickedUpAt = now
      break
    case "delivered":
      this.timing.deliveredAt = now
      this.loyaltyPointsEarned = this.calculateLoyaltyPoints()
      break
  }

  return this.save()
}

// Get estimated delivery time
orderSchema.methods.getEstimatedDeliveryTime = function () {
  const prep = this.timing.estimatedPreparation || 20
  const delivery = this.timing.estimatedDelivery || 25
  return prep + delivery
}

module.exports = mongoose.model("Order", orderSchema)
