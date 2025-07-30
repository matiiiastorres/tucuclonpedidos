const express = require("express")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const { protect } = require("../middleware/auth")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  })
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["client", "store_owner"]).withMessage("Invalid role"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { name, email, password, phone, role } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        })
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        phone,
        role: role || "client",
      })

      // Generate token
      const token = generateToken(user._id)

      // Remove password from response
      const userResponse = user.toObject()
      delete userResponse.password

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: userResponse,
          token,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      })
    }
  },
)

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      // Find user and include password for comparison
      const user = await User.findOne({ email, isActive: true }).select("+password")

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Generate token
      const token = generateToken(user._id)

      // Remove password from response
      const userResponse = user.toObject()
      delete userResponse.password

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: userResponse,
          token,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during login",
      })
    }
  },
)

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favoriteStores", "name logo rating").select("-password")

    res.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put(
  "/profile",
  protect,
  [
    body("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("phone").optional().isMobilePhone().withMessage("Please enter a valid phone number"),
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

      const { name, phone, preferences } = req.body

      const user = await User.findById(req.user.id)

      if (name) user.name = name
      if (phone) user.phone = phone
      if (preferences) user.preferences = { ...user.preferences, ...preferences }

      await user.save()

      const userResponse = user.toObject()
      delete userResponse.password

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: { user: userResponse },
      })
    } catch (error) {
      console.error("Profile update error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", protect, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({
    success: true,
    message: "Logged out successfully",
  })
})

module.exports = router
