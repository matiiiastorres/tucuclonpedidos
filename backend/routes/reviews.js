const express = require("express")
const router = express.Router()
const Review = require("../models/Review")
const Order = require("../models/Order")
const Store = require("../models/Store")
const { auth } = require("../middleware/auth")
const { body, param, query, validationResult } = require("express-validator")

// @desc    Get reviews for a store
// @route   GET /api/reviews/store/:storeId
// @access  Public
router.get("/store/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params
    const { page = 1, limit = 10, rating, sortBy = "createdAt" } = req.query

    let query = { store: storeId, isApproved: true }
    
    // Filter by rating if provided
    if (rating) {
      query.rating = parseInt(rating)
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: -1 },
      populate: [
        { path: "user", select: "name avatar" },
        { path: "order", select: "orderNumber createdAt" }
      ]
    }

    const reviews = await Review.paginate(query, options)

    res.json({
      success: true,
      data: reviews,
    })
  } catch (error) {
    console.error("Get store reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
router.get("/my-reviews", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const reviews = await Review.find({ user: req.user.id })
      .populate("store", "name logo")
      .populate("order", "orderNumber total")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Review.countDocuments({ user: req.user.id })

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    })
  } catch (error) {
    console.error("Get user reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post(
  "/",
  [
    auth,
    body("orderId").isMongoId().withMessage("Valid order ID is required"),
    body("storeId").isMongoId().withMessage("Valid store ID is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").optional().isLength({ max: 500 }).withMessage("Comment cannot exceed 500 characters"),
    body("foodQuality").optional().isInt({ min: 1, max: 5 }),
    body("deliveryTime").optional().isInt({ min: 1, max: 5 }),
    body("customerService").optional().isInt({ min: 1, max: 5 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: errors.array() 
        })
      }

      const { orderId, storeId, rating, comment, foodQuality, deliveryTime, customerService } = req.body

      // Verify the order exists and belongs to the user
      const order = await Order.findOne({ 
        _id: orderId, 
        user: req.user.id,
        store: storeId,
        status: "delivered" 
      })

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found or not eligible for review",
        })
      }

      // Check if user already reviewed this order
      const existingReview = await Review.findOne({ 
        user: req.user.id, 
        order: orderId 
      })

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this order",
        })
      }

      const review = new Review({
        user: req.user.id,
        store: storeId,
        order: orderId,
        rating,
        comment,
        foodQuality,
        deliveryTime,
        customerService,
      })

      await review.save()

      // Populate the review before sending response
      await review.populate("user", "name avatar")
      await review.populate("store", "name")

      res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review,
      })
    } catch (error) {
      console.error("Create review error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
router.put(
  "/:id",
  [
    auth,
    param("id").isMongoId().withMessage("Invalid review ID"),
    body("rating").optional().isInt({ min: 1, max: 5 }),
    body("comment").optional().isLength({ max: 500 }),
    body("foodQuality").optional().isInt({ min: 1, max: 5 }),
    body("deliveryTime").optional().isInt({ min: 1, max: 5 }),
    body("customerService").optional().isInt({ min: 1, max: 5 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: errors.array() 
        })
      }

      const review = await Review.findById(req.params.id)
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        })
      }

      // Check if user owns the review
      if (review.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this review",
        })
      }

      // Update the review
      Object.assign(review, req.body)
      await review.save()

      await review.populate("user", "name avatar")
      await review.populate("store", "name")

      res.json({
        success: true,
        message: "Review updated successfully",
        data: review,
      })
    } catch (error) {
      console.error("Update review error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      })
    }

    await Review.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Review deleted successfully",
    })
  } catch (error) {
    console.error("Delete review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Vote helpful on a review
// @route   POST /api/reviews/:id/helpful
// @access  Private
router.post("/:id/helpful", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    // Check if user already voted
    const hasVoted = review.votedUsers.includes(req.user.id)
    
    if (hasVoted) {
      // Remove vote
      review.votedUsers.pull(req.user.id)
      review.helpfulVotes -= 1
    } else {
      // Add vote
      review.votedUsers.push(req.user.id)
      review.helpfulVotes += 1
    }

    await review.save()

    res.json({
      success: true,
      message: hasVoted ? "Vote removed" : "Vote added",
      data: {
        helpfulVotes: review.helpfulVotes,
        hasVoted: !hasVoted,
      },
    })
  } catch (error) {
    console.error("Vote helpful error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
router.post("/:id/report", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    review.reportCount += 1
    review.isReported = true

    // Auto-hide review if it gets too many reports
    if (review.reportCount >= 5) {
      review.isApproved = false
    }

    await review.save()

    res.json({
      success: true,
      message: "Review reported successfully",
    })
  } catch (error) {
    console.error("Report review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Store owner response to review
// @route   POST /api/reviews/:id/response
// @access  Private (Store Owner)
router.post(
  "/:id/response",
  [
    auth,
    body("message").isLength({ min: 1, max: 500 }).withMessage("Response message is required (max 500 chars)"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: errors.array() 
        })
      }

      const review = await Review.findById(req.params.id).populate("store")
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        })
      }

      // Check if user is the store owner
      if (review.store.owner.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to respond to this review",
        })
      }

      review.storeResponse = {
        message: req.body.message,
        respondedAt: new Date(),
        respondedBy: req.user.id,
      }

      await review.save()
      await review.populate("storeResponse.respondedBy", "name")

      res.json({
        success: true,
        message: "Response added successfully",
        data: review,
      })
    } catch (error) {
      console.error("Store response error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Get reviews that can be written by user
// @route   GET /api/reviews/can-review
// @access  Private
router.get("/can-review", auth, async (req, res) => {
  try {
    // Find completed orders that haven't been reviewed yet
    const completedOrders = await Order.find({
      user: req.user.id,
      status: "delivered",
    }).populate("store", "name logo")

    // Get already reviewed order IDs
    const reviewedOrderIds = await Review.find(
      { user: req.user.id },
      "order"
    ).distinct("order")

    // Filter out already reviewed orders
    const canReviewOrders = completedOrders.filter(
      order => !reviewedOrderIds.includes(order._id.toString())
    )

    res.json({
      success: true,
      data: canReviewOrders,
    })
  } catch (error) {
    console.error("Get can review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Get store review statistics
// @route   GET /api/reviews/store/:storeId/stats
// @access  Public
router.get("/store/:storeId/stats", async (req, res) => {
  try {
    const { storeId } = req.params

    const stats = await Review.aggregate([
      { $match: { store: mongoose.Types.ObjectId(storeId), isApproved: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          averageFoodQuality: { $avg: "$foodQuality" },
          averageDeliveryTime: { $avg: "$deliveryTime" },
          averageCustomerService: { $avg: "$customerService" },
        },
      },
    ])

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { store: mongoose.Types.ObjectId(storeId), isApproved: true } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ])

    const result = stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      averageFoodQuality: 0,
      averageDeliveryTime: 0,
      averageCustomerService: 0,
    }

    result.ratingDistribution = ratingDistribution.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Get store review stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router