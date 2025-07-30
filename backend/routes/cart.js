const express = require("express")
const router = express.Router()
const Cart = require("../models/Cart")
const Product = require("../models/Product")
const Store = require("../models/Store")
const Coupon = require("../models/Coupon")
const { auth } = require("../middleware/auth")
const { body, param, validationResult } = require("express-validator")

// @desc    Get user's cart for a specific store
// @route   GET /api/cart/:storeId
// @access  Private
router.get(
  "/:storeId",
  [auth, param("storeId").isMongoId().withMessage("Invalid store ID")],
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

      const cart = await Cart.getOrCreateCart(req.user.id, req.params.storeId)
      
      res.json({
        success: true,
        data: cart,
      })
    } catch (error) {
      console.error("Get cart error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Add item to cart
// @route   POST /api/cart/:storeId/items
// @access  Private
router.post(
  "/:storeId/items",
  [
    auth,
    param("storeId").isMongoId().withMessage("Invalid store ID"),
    body("productId").isMongoId().withMessage("Invalid product ID"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("customizations").optional().isArray(),
    body("addons").optional().isArray(),
    body("specialInstructions").optional().isLength({ max: 200 }),
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

      const { productId, quantity, customizations = [], addons = [], specialInstructions } = req.body
      const { storeId } = req.params

      // Verify product exists and belongs to the store
      const product = await Product.findOne({ _id: productId, store: storeId })
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found in this store",
        })
      }

      // Check if product is available
      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Product is currently unavailable",
        })
      }

      // Calculate item price including customizations and addons
      let itemPrice = product.price
      let addonsPrice = 0

      // Add customization costs
      customizations.forEach(customization => {
        if (customization.price) {
          itemPrice += customization.price
        }
      })

      // Add addon costs
      addons.forEach(addon => {
        addonsPrice += (addon.price * addon.quantity)
      })

      const totalItemPrice = (itemPrice + addonsPrice) * quantity

      const cart = await Cart.getOrCreateCart(req.user.id, storeId)

      const itemData = {
        product: productId,
        quantity,
        customizations,
        addons,
        specialInstructions,
        price: itemPrice + addonsPrice,
        totalPrice: totalItemPrice,
      }

      await cart.addItem(itemData)

      // Populate the updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("items.product")
        .populate("store")

      res.json({
        success: true,
        message: "Item added to cart",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Add to cart error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:storeId/items/:itemId
// @access  Private
router.put(
  "/:storeId/items/:itemId",
  [
    auth,
    param("storeId").isMongoId().withMessage("Invalid store ID"),
    param("itemId").isMongoId().withMessage("Invalid item ID"),
    body("quantity").isInt({ min: 0 }).withMessage("Quantity must be 0 or greater"),
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

      const { storeId, itemId } = req.params
      const { quantity } = req.body

      const cart = await Cart.findOne({ user: req.user.id, store: storeId, isActive: true })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        })
      }

      await cart.updateItemQuantity(itemId, quantity)

      // Populate the updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("items.product")
        .populate("store")

      res.json({
        success: true,
        message: quantity === 0 ? "Item removed from cart" : "Item quantity updated",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Update cart item error:", error)
      res.status(500).json({
        success: false,
        message: error.message || "Server error",
      })
    }
  }
)

// @desc    Remove item from cart
// @route   DELETE /api/cart/:storeId/items/:itemId
// @access  Private
router.delete(
  "/:storeId/items/:itemId",
  [
    auth,
    param("storeId").isMongoId().withMessage("Invalid store ID"),
    param("itemId").isMongoId().withMessage("Invalid item ID"),
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

      const { storeId, itemId } = req.params

      const cart = await Cart.findOne({ user: req.user.id, store: storeId, isActive: true })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        })
      }

      await cart.removeItem(itemId)

      // Populate the updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("items.product")
        .populate("store")

      res.json({
        success: true,
        message: "Item removed from cart",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Remove cart item error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Apply coupon to cart
// @route   POST /api/cart/:storeId/coupon
// @access  Private
router.post(
  "/:storeId/coupon",
  [
    auth,
    param("storeId").isMongoId().withMessage("Invalid store ID"),
    body("couponCode").notEmpty().withMessage("Coupon code is required"),
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

      const { storeId } = req.params
      const { couponCode } = req.body

      const cart = await Cart.findOne({ user: req.user.id, store: storeId, isActive: true })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        })
      }

      if (cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        })
      }

      // Find the coupon
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true,
      })

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Invalid coupon code",
        })
      }

      // Check if coupon is applicable to this store
      if (coupon.applicableStores.length > 0 && 
          !coupon.applicableStores.includes(storeId)) {
        return res.status(400).json({
          success: false,
          message: "Coupon not applicable to this store",
        })
      }

      // Check if user can use this coupon
      const canUse = coupon.canUserUseCoupon(req.user.id, cart.subtotal)
      if (!canUse.valid) {
        return res.status(400).json({
          success: false,
          message: canUse.reason,
        })
      }

      // Calculate discount
      const discountAmount = coupon.calculateDiscount(cart.subtotal, cart.deliveryFee)

      // Apply coupon to cart
      await cart.applyCoupon(coupon, discountAmount)

      // Populate the updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("items.product")
        .populate("store")

      res.json({
        success: true,
        message: "Coupon applied successfully",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Apply coupon error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Remove coupon from cart
// @route   DELETE /api/cart/:storeId/coupon
// @access  Private
router.delete(
  "/:storeId/coupon",
  [auth, param("storeId").isMongoId().withMessage("Invalid store ID")],
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

      const { storeId } = req.params

      const cart = await Cart.findOne({ user: req.user.id, store: storeId, isActive: true })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        })
      }

      await cart.removeCoupon()

      // Populate the updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("items.product")
        .populate("store")

      res.json({
        success: true,
        message: "Coupon removed",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Remove coupon error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Clear cart
// @route   DELETE /api/cart/:storeId
// @access  Private
router.delete(
  "/:storeId",
  [auth, param("storeId").isMongoId().withMessage("Invalid store ID")],
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

      const { storeId } = req.params

      const cart = await Cart.findOne({ user: req.user.id, store: storeId, isActive: true })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        })
      }

      await cart.clearCart()

      res.json({
        success: true,
        message: "Cart cleared",
        data: cart,
      })
    } catch (error) {
      console.error("Clear cart error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// @desc    Update delivery address for cart
// @route   PUT /api/cart/:storeId/delivery-address
// @access  Private
router.put(
  "/:storeId/delivery-address",
  [
    auth,
    param("storeId").isMongoId().withMessage("Invalid store ID"),
    body("address").isObject().withMessage("Address is required"),
    body("address.street").notEmpty().withMessage("Street address is required"),
    body("address.city").notEmpty().withMessage("City is required"),
    body("address.coordinates.lat").isFloat().withMessage("Valid latitude is required"),
    body("address.coordinates.lng").isFloat().withMessage("Valid longitude is required"),
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

      const { storeId } = req.params
      const { address } = req.body

      const cart = await Cart.findOne({ user: req.user.id, store: storeId, isActive: true })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        })
      }

      // Calculate delivery fee based on distance (basic implementation)
      const store = await Store.findById(storeId)
      if (store && store.location && store.location.coordinates) {
        const distance = calculateDistance(
          store.location.coordinates.lat,
          store.location.coordinates.lng,
          address.coordinates.lat,
          address.coordinates.lng
        )
        
        // Basic delivery fee calculation (should be more sophisticated)
        cart.deliveryFee = Math.max(2.99, distance * 0.5)
      }

      cart.deliveryAddress = address
      await cart.save()

      // Populate the updated cart
      const updatedCart = await Cart.findById(cart._id)
        .populate("items.product")
        .populate("store")

      res.json({
        success: true,
        message: "Delivery address updated",
        data: updatedCart,
      })
    } catch (error) {
      console.error("Update delivery address error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  }
)

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in km
}

module.exports = router