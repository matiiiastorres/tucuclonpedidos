const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "Coupon code cannot be more than 20 characters"],
    },
    title: {
      type: String,
      required: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    
    // Discount settings
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "freeDelivery"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // For percentage discounts
    },
    
    // Usage restrictions
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxUsage: {
      type: Number,
      default: null, // null = unlimited
    },
    maxUsagePerUser: {
      type: Number,
      default: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    
    // Time restrictions
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    
    // Applicable to
    applicableStores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    
    // User restrictions
    eligibleUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    newUsersOnly: {
      type: Boolean,
      default: false,
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Created by (admin or store owner)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Usage tracking
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        discountApplied: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Indexes
couponSchema.index({ code: 1 })
couponSchema.index({ startDate: 1, endDate: 1 })
couponSchema.index({ isActive: 1 })
couponSchema.index({ createdBy: 1 })

// Virtual for checking if coupon is valid
couponSchema.virtual("isValid").get(function () {
  const now = new Date()
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.maxUsage === null || this.usageCount < this.maxUsage)
  )
})

// Method to check if user can use coupon
couponSchema.methods.canUserUseCoupon = function (userId, orderAmount) {
  const now = new Date()
  
  // Check if coupon is active and within date range
  if (!this.isActive || now < this.startDate || now > this.endDate) {
    return { valid: false, reason: "Coupon expired or inactive" }
  }
  
  // Check usage limits
  if (this.maxUsage !== null && this.usageCount >= this.maxUsage) {
    return { valid: false, reason: "Coupon usage limit reached" }
  }
  
  // Check user usage limit
  const userUsageCount = this.usedBy.filter(
    (usage) => usage.user.toString() === userId.toString()
  ).length
  
  if (userUsageCount >= this.maxUsagePerUser) {
    return { valid: false, reason: "User usage limit reached" }
  }
  
  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    return { 
      valid: false, 
      reason: `Minimum order amount is $${this.minOrderAmount}` 
    }
  }
  
  // Check if user is eligible (if restrictions exist)
  if (this.eligibleUsers.length > 0) {
    const isEligible = this.eligibleUsers.some(
      (user) => user.toString() === userId.toString()
    )
    if (!isEligible) {
      return { valid: false, reason: "User not eligible for this coupon" }
    }
  }
  
  return { valid: true }
}

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (orderAmount, deliveryFee = 0) {
  let discount = 0
  
  switch (this.discountType) {
    case "percentage":
      discount = (orderAmount * this.discountValue) / 100
      if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
        discount = this.maxDiscountAmount
      }
      break
    case "fixed":
      discount = Math.min(this.discountValue, orderAmount)
      break
    case "freeDelivery":
      discount = deliveryFee
      break
  }
  
  return Math.round(discount * 100) / 100 // Round to 2 decimal places
}

// Method to use coupon
couponSchema.methods.useCoupon = function (userId, orderId, discountApplied) {
  this.usageCount += 1
  this.usedBy.push({
    user: userId,
    order: orderId,
    discountApplied: discountApplied,
  })
  return this.save()
}

module.exports = mongoose.model("Coupon", couponSchema)