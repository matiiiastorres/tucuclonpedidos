const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      })
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

      // Get user from token
      const user = await User.findById(decoded.userId).select("-password")

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found or inactive",
        })
      }

      req.user = user
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token invalid",
      })
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      message: "Server error in authentication",
    })
  }
}

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`,
      })
    }

    next()
  }
}

module.exports = {
  protect,
  authorize,
}
