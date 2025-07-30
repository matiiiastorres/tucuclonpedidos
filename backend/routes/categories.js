const express = require("express")

const router = express.Router()

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get("/", async (req, res) => {
  try {
    // Mock data for now
    const categories = [
      { id: "1", name: "Restaurantes", icon: "🍕", count: 150 },
      { id: "2", name: "Supermercados", icon: "🛒", count: 45 },
      { id: "3", name: "Farmacias", icon: "💊", count: 30 },
    ]

    res.json({
      success: true,
      data: { categories },
    })
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
