const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const compression = require("compression")
const morgan = require("morgan")
const { createServer } = require("http")
const { Server } = require("socket.io")
require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const storeRoutes = require("./routes/stores")
const productRoutes = require("./routes/products")
const orderRoutes = require("./routes/orders")
const categoryRoutes = require("./routes/categories")
const locationRoutes = require("./routes/location")
const adminRoutes = require("./routes/admin")
const uploadRoutes = require("./routes/upload")
const cartRoutes = require("./routes/cart")
const couponRoutes = require("./routes/coupons")
const reviewRoutes = require("./routes/reviews")

// Import middleware
const { errorHandler } = require("./middleware/errorHandler")
const { notFound } = require("./middleware/notFound")

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Security middleware
app.use(helmet())
app.use(compression())

// Logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"))
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Static files
app.use("/uploads", express.static("uploads"))

// Socket.IO for real-time features
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join room for order tracking
  socket.on("join-order", (orderId) => {
    socket.join(`order-${orderId}`)
    console.log(`User ${socket.id} joined order room: ${orderId}`)
  })

  // Join room for store dashboard
  socket.on("join-store", (storeId) => {
    socket.join(`store-${storeId}`)
    console.log(`User ${socket.id} joined store room: ${storeId}`)
  })

  // Handle real-time location updates for delivery
  socket.on("update-delivery-location", (data) => {
    const { orderId, location } = data
    socket.to(`order-${orderId}`).emit("delivery-location-updated", location)
  })

  // Handle delivery status updates
  socket.on("update-delivery-status", (data) => {
    const { orderId, status, estimatedTime } = data
    socket.to(`order-${orderId}`).emit("delivery-status-updated", { status, estimatedTime })
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Make io accessible to routes
app.set("io", io)

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/delivery-app", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/stores", storeRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/location", locationRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/reviews", reviewRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
})

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Delivery App API",
    version: "1.0.0",
    documentation: "/api/health",
  })
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`)
  // Close server & exit process
  server.close(() => {
    process.exit(1)
  })
})

module.exports = { app, io }
