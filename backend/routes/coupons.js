const express = require("express")
const router = express.Router()
const Coupon = require("../models/Coupon")
const { auth, adminAuth, storeOwnerAuth } = require("../middleware/auth")
const { body, param, query, validationResult } = require("express-validator")

// @desc    Get available coupons for user
// @route   GET /api/coupons
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { storeId } = req.query
    const now = new Date()

    let query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { maxUsage: null },
        { $expr: { $lt: ["$usageCount", "$maxUsage"] } }
      ]
    }

    // Filter by store if provided
    if (storeId) {
      query.$and = [
        {
          $or: [
            { applicableStores: { $size: 0 } },
            { applicableStores: storeId }
          ]
        }
      ]
    }

    // Filter by user eligibility
    query.$and = query.$and || []
    query.$and.push({
      $or: [
        { eligibleUsers: { $size: 0 } },
        { eligibleUsers: req.user.id }
      ]
    })

    const coupons = await Coupon.find(query)
      .populate("applicableStores", "name logo")
      .populate("applicableCategories", "name")
      .sort({ discountValue: -1 })
      .limit(20)

    // Filter out coupons user has already used max times
    const availableCoupons = coupons.filter(coupon => {
      const userUsageCount = coupon.usedBy.filter(
        usage => usage.user.toString() === req.user.id
      ).length
      return userUsageCount < coupon.maxUsagePerUser
    })

    res.json({
      success: true,
      data: availableCoupons,
    })
  } catch (error) {
    console.error("Get coupons error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Private
router.post(
  "/validate",
  [
    auth,
    body("code").notEmpty().withMessage("Coupon code is required"),
    body("orderAmount").isFloat({ min: 0 }).withMessage("Valid order amount is required"),
    body("storeId").optional().isMongoId().withMessage("Invalid store ID"),
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

      const { code, orderAmount, storeId } = req.body

      const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(),
        isActive: true,
      })

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Invalid coupon code",
        })
      }

      // Check if coupon is applicable to this store
      if (storeId && coupon.applicableStores.length > 0 && 
          !coupon.applicableStores.includes(storeId)) {
        return res.status(400).json({
          success: false,
          message: "Coupon not applicable to this store",
        })
      }

      // Check if user can use this coupon
      const canUse = coupon.canUserUseCoupon(req.user.id, orderAmount)
      if (!canUse.valid) {
        return res.status(400).json({
          success: false,
          message: canUse.reason,
        })
      }

      // Calculate discount
      const discountAmount = coupon.calculateDiscount(orderAmount)

      res.json({
        success: true,
        data: {
          coupon: {
            _id: coupon._id,
            code: coupon.code,
            title: coupon.title,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
          },
          discountAmount,
          finalAmount: Math.max(0, orderAmount - discountAmount),
        },
      })
    } catch (error) {
      console.error("Validate coupon error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Create coupon (Admin or Store Owner)
// @route   POST /api/coupons
// @access  Private (Admin/Store Owner)
router.post(
  "/",
  [
    auth,
    body("code").isLength({ min: 3, max: 20 }).withMessage("Code must be 3-20 characters"),
    body("title").isLength({ min: 1, max: 100 }).withMessage("Title is required (max 100 chars)"),
    body("discountType").isIn(["percentage", "fixed", "freeDelivery"]).withMessage("Invalid discount type"),
    body("discountValue").isFloat({ min: 0 }).withMessage("Discount value must be positive"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
    body("minOrderAmount").optional().isFloat({ min: 0 }),
    body("maxUsage").optional().isInt({ min: 1 }),
    body("maxUsagePerUser").optional().isInt({ min: 1 }),
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

      // Check if user is admin or store owner
      if (req.user.role !== "admin" && req.user.role !== "store_owner") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to create coupons",
        })
      }

      const couponData = {
        ...req.body,
        code: req.body.code.toUpperCase(),
        createdBy: req.user.id,
      }

      // Validate dates
      const startDate = new Date(req.body.startDate)
      const endDate = new Date(req.body.endDate)
      
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date",
        })
      }

      // If store owner, limit scope to their stores
      if (req.user.role === "store_owner") {
        // Get user's stores (assuming user has stores array or we fetch from Store model)
        const Store = require("../models/Store")
        const userStores = await Store.find({ owner: req.user.id }, "_id")
        couponData.applicableStores = userStores.map(store => store._id)
      }

      const coupon = new Coupon(couponData)
      await coupon.save()

      res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        data: coupon,
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists",
        })
      }
      console.error("Create coupon error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Get coupons by store owner or admin
// @route   GET /api/coupons/manage
// @access  Private (Admin/Store Owner)
router.get("/manage", auth, async (req, res) => {
  try {
    // Check if user is admin or store owner
    if (req.user.role !== "admin" && req.user.role !== "store_owner") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage coupons",
      })
    }

    let query = {}

    // If store owner, only show their coupons
    if (req.user.role === "store_owner") {
      query.createdBy = req.user.id
    }

    const coupons = await Coupon.find(query)
      .populate("applicableStores", "name")
      .populate("applicableCategories", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: coupons,
    })
  } catch (error) {
    console.error("Get manage coupons error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private (Admin/Store Owner)
router.put(
  "/:id",
  [
    auth,
    param("id").isMongoId().withMessage("Invalid coupon ID"),
    body("title").optional().isLength({ max: 100 }),
    body("description").optional().isLength({ max: 500 }),
    body("startDate").optional().isISO8601(),
    body("endDate").optional().isISO8601(),
    body("isActive").optional().isBoolean(),
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

      const coupon = await Coupon.findById(req.params.id)
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Coupon not found",
        })
      }

      // Check ownership
      if (req.user.role !== "admin" && coupon.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this coupon",
        })
      }

      // Validate dates if provided
      if (req.body.startDate && req.body.endDate) {
        const startDate = new Date(req.body.startDate)
        const endDate = new Date(req.body.endDate)
        
        if (endDate <= startDate) {
          return res.status(400).json({
            success: false,
            message: "End date must be after start date",
          })
        }
      }

      Object.assign(coupon, req.body)
      await coupon.save()

      res.json({
        success: true,
        message: "Coupon updated successfully",
        data: coupon,
      })
    } catch (error) {
      console.error("Update coupon error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin/Store Owner)
router.delete("/:id", auth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      })
    }

    // Check ownership
    if (req.user.role !== "admin" && coupon.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this coupon",
      })
    }

    await Coupon.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    })
  } catch (error) {
    console.error("Delete coupon error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Get coupon usage statistics
// @route   GET /api/coupons/:id/stats
// @access  Private (Admin/Store Owner)
router.get("/:id/stats", auth, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate("usedBy.user", "name email")
      .populate("usedBy.order", "orderNumber total")

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      })
    }

    // Check ownership
    if (req.user.role !== "admin" && coupon.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this coupon statistics",
      })
    }

    const stats = {
      totalUsage: coupon.usageCount,
      totalDiscountGiven: coupon.usedBy.reduce((sum, usage) => sum + usage.discountApplied, 0),
      uniqueUsers: new Set(coupon.usedBy.map(usage => usage.user._id.toString())).size,
      usageByDate: {},
      recentUsage: coupon.usedBy.slice(-10).reverse(),
    }

    // Group usage by date
    coupon.usedBy.forEach(usage => {
      const date = usage.usedAt.toISOString().split('T')[0]
      stats.usageByDate[date] = (stats.usageByDate[date] || 0) + 1
    })

    res.json({
      success: true,
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          title: coupon.title,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxUsage: coupon.maxUsage,
          isActive: coupon.isActive,
        },
        statistics: stats,
      },
    })
  } catch (error) {
    console.error("Get coupon stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router