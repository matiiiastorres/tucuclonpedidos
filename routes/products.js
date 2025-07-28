const express = require("express")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get("/", async (req, res) => {
  try {
    // Mock data for now
    const products = []

    res.json({
      success: true,
      data: { products },
    })
  } catch (error) {
    console.error("Get products error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
