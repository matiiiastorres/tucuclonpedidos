const express = require("express")
const { protect, authorize } = require("../middleware/auth")

const router = express.Router()

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get("/dashboard", protect, authorize("admin"), async (req, res) => {
  try {
    // Mock admin data
    const dashboardData = {
      totalUsers: 1250,
      totalStores: 85,
      totalOrders: 3420,
      totalRevenue: 125000,
    }

    res.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
