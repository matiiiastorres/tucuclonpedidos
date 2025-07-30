const express = require("express")

const router = express.Router()

// @desc    Geocode address
// @route   POST /api/location/geocode
// @access  Public
router.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body

    // Mock geocoding response
    const location = {
      coordinates: { lat: -34.6037, lng: -58.3816 },
      address,
      city: "Buenos Aires",
      state: "CABA",
      country: "Argentina",
    }

    res.json({
      success: true,
      data: { location },
    })
  } catch (error) {
    console.error("Geocode error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
