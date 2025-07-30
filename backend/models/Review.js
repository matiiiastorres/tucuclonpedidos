const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema(
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
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: [500, "Comment cannot be more than 500 characters"],
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    // Detailed ratings
    foodQuality: { type: Number, min: 1, max: 5 },
    deliveryTime: { type: Number, min: 1, max: 5 },
    customerService: { type: Number, min: 1, max: 5 },
    
    // Admin moderation
    isApproved: {
      type: Boolean,
      default: true,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    
    // Store response
    storeResponse: {
      message: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    
    // Helpful votes
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    votedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Indexes
reviewSchema.index({ store: 1, createdAt: -1 })
reviewSchema.index({ user: 1 })
reviewSchema.index({ rating: 1 })

// Ensure one review per user per order
reviewSchema.index({ user: 1, order: 1 }, { unique: true })

// Calculate average rating for store
reviewSchema.statics.calcAverageRating = async function (storeId) {
  const stats = await this.aggregate([
    {
      $match: { store: storeId, isApproved: true },
    },
    {
      $group: {
        _id: "$store",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ])

  if (stats.length > 0) {
    await this.model("Store").findByIdAndUpdate(storeId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    })
  } else {
    await this.model("Store").findByIdAndUpdate(storeId, {
      averageRating: 0,
      totalReviews: 0,
    })
  }
}

// Update store rating after save
reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.store)
})

// Update store rating after remove
reviewSchema.post("remove", function () {
  this.constructor.calcAverageRating(this.store)
})

module.exports = mongoose.model("Review", reviewSchema)