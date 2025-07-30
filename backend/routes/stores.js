const express = require("express")
const { body, query, validationResult } = require("express-validator")
const Store = require("../models/Store")
const Product = require("../models/Product")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// @desc    Get all stores with filters
// @route   GET /api/stores
// @access  Public
router.get(
  "/",
  [
    query("category").optional().isMongoId().withMessage("Invalid category ID"),
    query("lat").optional().isFloat().withMessage("Invalid latitude"),
    query("lng").optional().isFloat().withMessage("Invalid longitude"),
    query("radius").optional().isFloat({ min: 0.1, max: 50 }).withMessage("Radius must be between 0.1 and 50 km"),
    query("search").optional().trim().isLength({ min: 1 }).withMessage("Search term too short"),
    query("sortBy")
      .optional()
      .isIn(["distance", "rating", "deliveryTime", "deliveryFee"])
      .withMessage("Invalid sort option"),
    query("isOpen").optional().isBoolean().withMessage("isOpen must be boolean"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be positive integer"),
    query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { category, lat, lng, radius = 10, search, sortBy = "rating", isOpen, page = 1, limit = 20 } = req.query

      // Build query
      const query = { isActive: true }

      // Category filter
      if (category) {
        query.category = category
      }

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ]
      }

      // Location-based query
      if (lat && lng) {
        query.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
            },
            $maxDistance: Number.parseFloat(radius) * 1000, // Convert km to meters
          },
        }
      }

      // Build aggregation pipeline
      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $addFields: {
            categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] },
          },
        },
      ]

      // Add distance calculation if coordinates provided
      if (lat && lng) {
        pipeline.push({
          $addFields: {
            distance: {
              $divide: [
                {
                  $sqrt: {
                    $add: [
                      {
                        $pow: [
                          {
                            $multiply: [
                              { $subtract: [{ $arrayElemAt: ["$location.coordinates", 1] }, Number.parseFloat(lat)] },
                              111.32,
                            ],
                          },
                          2,
                        ],
                      },
                      {
                        $pow: [
                          {
                            $multiply: [
                              { $subtract: [{ $arrayElemAt: ["$location.coordinates", 0] }, Number.parseFloat(lng)] },
                              { $multiply: [111.32, { $cos: { $multiply: [Number.parseFloat(lat), Math.PI / 180] } }] },
                            ],
                          },
                          2,
                        ],
                      },
                    ],
                  },
                },
                1,
              ],
            },
          },
        })
      }

      // Filter by open status
      if (isOpen === "true") {
        // This would require more complex logic to check current time against operating hours
        // For now, we'll assume all active stores are open
      }

      // Sort
      const sortStage = {}
      switch (sortBy) {
        case "distance":
          if (lat && lng) sortStage.distance = 1
          else sortStage["rating.average"] = -1
          break
        case "rating":
          sortStage["rating.average"] = -1
          break
        case "deliveryTime":
          sortStage["deliveryInfo.estimatedDeliveryTime.min"] = 1
          break
        case "deliveryFee":
          sortStage["deliveryInfo.deliveryFee"] = 1
          break
        default:
          sortStage["rating.average"] = -1
      }

      pipeline.push({ $sort: sortStage })

      // Pagination
      const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)
      pipeline.push({ $skip: skip }, { $limit: Number.parseInt(limit) })

      // Project fields
      pipeline.push({
        $project: {
          name: 1,
          description: 1,
          logo: 1,
          banner: 1,
          address: 1,
          location: 1,
          phone: 1,
          rating: 1,
          tags: 1,
          deliveryInfo: 1,
          categoryName: 1,
          distance: 1,
          isVerified: 1,
          isFeatured: 1,
        },
      })

      const stores = await Store.aggregate(pipeline)

      // Get total count for pagination
      const totalStores = await Store.countDocuments(query)
      const totalPages = Math.ceil(totalStores / Number.parseInt(limit))

      res.json({
        success: true,
        data: {
          stores,
          pagination: {
            currentPage: Number.parseInt(page),
            totalPages,
            totalStores,
            hasNext: Number.parseInt(page) < totalPages,
            hasPrev: Number.parseInt(page) > 1,
          },
        },
      })
    } catch (error) {
      console.error("Get stores error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate("category", "name slug").populate("owner", "name email")

    if (!store || !store.isActive) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      })
    }

    // Get store products
    const products = await Product.find({
      store: store._id,
      isAvailable: true,
    }).sort({ category: 1, name: 1 })

    res.json({
      success: true,
      data: {
        store,
        products,
      },
    })
  } catch (error) {
    console.error("Get store error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Create store
// @route   POST /api/stores
// @access  Private (Store Owner)
router.post(
  "/",
  protect,
  authorize("store_owner", "admin"),
  [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Store name must be between 2 and 100 characters"),
    body("description").optional().isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
    body("category").isMongoId().withMessage("Invalid category ID"),
    body("address.street").notEmpty().withMessage("Street address is required"),
    body("address.city").notEmpty().withMessage("City is required"),
    body("address.state").notEmpty().withMessage("State is required"),
    body("location.coordinates").isArray({ min: 2, max: 2 }).withMessage("Location coordinates must be [lng, lat]"),
    body("phone").isMobilePhone().withMessage("Valid phone number is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      // Check if user already has a store
      const existingStore = await Store.findOne({ owner: req.user.id })
      if (existingStore) {
        return res.status(400).json({
          success: false,
          message: "You already have a store registered",
        })
      }

      const storeData = {
        ...req.body,
        owner: req.user.id,
      }

      const store = await Store.create(storeData)
      await store.populate("category", "name slug")

      res.status(201).json({
        success: true,
        message: "Store created successfully",
        data: { store },
      })
    } catch (error) {
      console.error("Create store error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private (Store Owner/Admin)
router.put("/:id", protect, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      })
    }

    // Check ownership or admin role
    if (store.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this store",
      })
    }

    const updatedStore = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug")

    res.json({
      success: true,
      message: "Store updated successfully",
      data: { store: updatedStore },
    })
  } catch (error) {
    console.error("Update store error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Delete store
// @route   DELETE /api/stores/:id
// @access  Private (Store Owner/Admin)
router.delete("/:id", protect, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      })
    }

    // Check ownership or admin role
    if (store.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this store",
      })
    }

    // Soft delete - just deactivate
    store.isActive = false
    await store.save()

    res.json({
      success: true,
      message: "Store deleted successfully",
    })
  } catch (error) {
    console.error("Delete store error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Get featured stores
// @route   GET /api/stores/featured/list
// @access  Public
router.get("/featured/list", async (req, res) => {
  try {
    // Mock data for now
    const stores = [
      {
        id: "1",
        name: "Pizza Palace",
        category: "Restaurantes",
        rating: 4.8,
        deliveryTime: "25-35 min",
        deliveryFee: 2.5,
        image: "/placeholder.svg?height=200&width=300",
        tags: ["Pizza", "Italiana"],
        distance: 1.2,
      },
    ]

    res.json({
      success: true,
      data: { stores },
    })
  } catch (error) {
    console.error("Get featured stores error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
