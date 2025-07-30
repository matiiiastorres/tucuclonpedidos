const express = require("express")
const { body, query, validationResult } = require("express-validator")
const Order = require("../models/Order")
const Store = require("../models/Store")
const Product = require("../models/Product")
const User = require("../models/User")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post(
  "/",
  protect,
  [
    body("storeId").isMongoId().withMessage("Invalid store ID"),
    body("items").isArray({ min: 1 }).withMessage("Order must have at least one item"),
    body("items.*.productId").isMongoId().withMessage("Invalid product ID"),
    body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("deliveryAddress.street").notEmpty().withMessage("Delivery street is required"),
    body("deliveryAddress.city").notEmpty().withMessage("Delivery city is required"),
    body("deliveryAddress.coordinates.lat").isFloat().withMessage("Invalid latitude"),
    body("deliveryAddress.coordinates.lng").isFloat().withMessage("Invalid longitude"),
    body("paymentMethod").isIn(["cash", "card", "digital_wallet"]).withMessage("Invalid payment method"),
    body("contactInfo.phone").isMobilePhone().withMessage("Valid phone number is required"),
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

      const { storeId, items, deliveryAddress, paymentMethod, contactInfo, specialInstructions, couponCode } = req.body

      // Verify store exists and is active
      const store = await Store.findById(storeId)
      if (!store || !store.isActive) {
        return res.status(404).json({
          success: false,
          message: "Store not found or inactive",
        })
      }

      // Check if store can deliver to the address
      if (!store.canDeliverTo(deliveryAddress.coordinates)) {
        return res.status(400).json({
          success: false,
          message: "Store does not deliver to this location",
        })
      }

      // Verify products and calculate pricing
      let subtotal = 0
      const orderItems = []

      for (const item of items) {
        const product = await Product.findById(item.productId)
        if (!product || !product.isAvailable || product.store.toString() !== storeId) {
          return res.status(400).json({
            success: false,
            message: `Product ${item.productId} not available`,
          })
        }

        // Check stock
        if (!product.isInStock(item.quantity)) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
          })
        }

        const itemPrice = product.finalPrice

        // Calculate options price
        let optionsPrice = 0
        if (item.options) {
          for (const option of item.options) {
            const productOption = product.options.find((o) => o.name === option.name)
            if (productOption) {
              const choice = productOption.choices.find((c) => c.name === option.choice)
              if (choice) {
                optionsPrice += choice.price
              }
            }
          }
        }

        const totalItemPrice = (itemPrice + optionsPrice) * item.quantity
        subtotal += totalItemPrice

        orderItems.push({
          product: product._id,
          name: product.name,
          price: itemPrice,
          quantity: item.quantity,
          options: item.options || [],
          specialInstructions: item.specialInstructions,
        })
      }

      // Calculate fees
      const deliveryFee = store.deliveryInfo.deliveryFee
      const serviceFee = subtotal * 0.05 // 5% service fee
      const tax = subtotal * 0.1 // 10% tax

      // Apply coupon if provided
      let discount = 0
      let coupon = null
      if (couponCode) {
        // Simple coupon validation (in real app, you'd have a Coupon model)
        const validCoupons = {
          FIRST10: { type: "percentage", value: 10 },
          SAVE5: { type: "fixed", value: 5 },
          WELCOME20: { type: "percentage", value: 20 },
        }

        if (validCoupons[couponCode.toUpperCase()]) {
          const couponData = validCoupons[couponCode.toUpperCase()]
          coupon = {
            code: couponCode.toUpperCase(),
            type: couponData.type,
            discount: couponData.value,
          }

          if (couponData.type === "percentage") {
            discount = subtotal * (couponData.value / 100)
          } else {
            discount = couponData.value
          }
        }
      }

      const total = Math.max(0, subtotal + deliveryFee + serviceFee + tax - discount)

      // Calculate estimated delivery time
      const distance = store.distanceFrom(deliveryAddress.coordinates)
      const estimatedDelivery = Math.round(20 + distance * 3) // Base 20 min + 3 min per km

      // Create order
      const order = await Order.create({
        customer: req.user.id,
        store: storeId,
        items: orderItems,
        deliveryAddress,
        contactInfo,
        paymentInfo: {
          method: paymentMethod,
          status: paymentMethod === "cash" ? "pending" : "paid",
        },
        pricing: {
          subtotal,
          deliveryFee,
          serviceFee,
          tax,
          discount,
          total,
        },
        coupon,
        timing: {
          estimatedPreparation: 20,
          estimatedDelivery,
        },
        specialInstructions,
      })

      // Update product stock
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity, totalOrders: item.quantity },
        })
      }

      // Update store stats
      await Store.findByIdAndUpdate(storeId, {
        $inc: { totalOrders: 1, totalRevenue: total },
      })

      // Add loyalty points to user
      const loyaltyPoints = Math.floor(total / 10)
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { loyaltyPoints },
      })

      // Populate order for response
      await order.populate([
        { path: "store", select: "name phone address" },
        { path: "items.product", select: "name images" },
      ])

      // Emit real-time event to store
      const io = req.app.get("io")
      io.to(`store-${storeId}`).emit("new-order", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customer: req.user.name,
        total: order.pricing.total,
        items: order.items.length,
      })

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: { order },
      })
    } catch (error) {
      console.error("Create order error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    // Mock data for now
    const orders = []

    res.json({
      success: true,
      data: { orders },
    })
  } catch (error) {
    console.error("Get orders error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("store", "name logo phone address")
      .populate("items.product", "name images")
      .populate("driver", "name phone")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if user owns this order or is store owner/admin
    if (
      order.customer.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      order.store.owner?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      })
    }

    res.json({
      success: true,
      data: { order },
    })
  } catch (error) {
    console.error("Get order error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Store Owner/Admin)
router.put(
  "/:id/status",
  protect,
  [body("status").isIn(["confirmed", "preparing", "ready", "on_way", "delivered", "cancelled"])],
  async (req, res) => {
    try {
      const { status } = req.body

      const order = await Order.findById(req.params.id).populate("store")
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Check authorization
      if (
        req.user.role !== "admin" &&
        order.store.owner.toString() !== req.user.id &&
        req.user.role !== "delivery_driver"
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this order",
        })
      }

      await order.updateStatus(status)

      // Emit real-time update to customer
      const io = req.app.get("io")
      io.to(`order-${order._id}`).emit("order-status-updated", {
        orderId: order._id,
        status: order.status,
        timestamp: new Date(),
      })

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: { order },
      })
    } catch (error) {
      console.error("Update order status error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put(
  "/:id/cancel",
  protect,
  [body("reason").optional().isLength({ max: 200 }).withMessage("Reason too long")],
  async (req, res) => {
    try {
      const { reason } = req.body

      const order = await Order.findById(req.params.id)
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Check if user can cancel this order
      if (order.customer.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to cancel this order",
        })
      }

      if (!order.canBeCancelled()) {
        return res.status(400).json({
          success: false,
          message: "Order cannot be cancelled at this stage",
        })
      }

      order.status = "cancelled"
      order.cancellationReason = reason
      await order.save()

      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        })
      }

      // Emit real-time update
      const io = req.app.get("io")
      io.to(`order-${order._id}`).emit("order-cancelled", {
        orderId: order._id,
        reason,
      })

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: { order },
      })
    } catch (error) {
      console.error("Cancel order error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @desc    Rate order
// @route   POST /api/orders/:id/rate
// @access  Private
router.post(
  "/:id/rate",
  protect,
  [
    body("food").isInt({ min: 1, max: 5 }).withMessage("Food rating must be between 1 and 5"),
    body("delivery").isInt({ min: 1, max: 5 }).withMessage("Delivery rating must be between 1 and 5"),
    body("comment").optional().isLength({ max: 500 }).withMessage("Comment too long"),
  ],
  async (req, res) => {
    try {
      const { food, delivery, comment } = req.body

      const order = await Order.findById(req.params.id).populate("store")
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        })
      }

      // Check if user owns this order
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to rate this order",
        })
      }

      if (!order.canBeRated()) {
        return res.status(400).json({
          success: false,
          message: "Order cannot be rated",
        })
      }

      const overall = Math.round((food + delivery) / 2)

      order.rating = {
        food,
        delivery,
        overall,
        comment,
        ratedAt: new Date(),
      }

      await order.save()

      // Update store rating
      await order.store.updateRating(overall)

      res.json({
        success: true,
        message: "Order rated successfully",
        data: { order },
      })
    } catch (error) {
      console.error("Rate order error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

module.exports = router
