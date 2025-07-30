const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxlength: [50, "Category name cannot be more than 50 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot be more than 200 characters"],
    },
    icon: String, // emoji or icon name
    image: String, // category image URL
    color: {
      type: String,
      default: "#3B82F6", // default blue color
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    level: {
      type: Number,
      default: 0, // 0 for main categories, 1 for subcategories, etc.
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    storeCount: {
      type: Number,
      default: 0,
    },
    productCount: {
      type: Number,
      default: 0,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
categorySchema.index({ slug: 1 })
categorySchema.index({ parent: 1, sortOrder: 1 })
categorySchema.index({ isActive: 1, isFeatured: -1, sortOrder: 1 })

// Generate slug from name
categorySchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }
  next()
})

// Get subcategories
categorySchema.methods.getSubcategories = function () {
  return this.constructor.find({ parent: this._id, isActive: true }).sort({ sortOrder: 1, name: 1 })
}

// Get category path (breadcrumb)
categorySchema.methods.getPath = async function () {
  const path = [this]
  let current = this

  while (current.parent) {
    current = await this.constructor.findById(current.parent)
    if (current) path.unshift(current)
  }

  return path
}

// Update counts
categorySchema.methods.updateCounts = async function () {
  const Store = mongoose.model("Store")
  const Product = mongoose.model("Product")

  this.storeCount = await Store.countDocuments({
    category: this._id,
    isActive: true,
  })

  // Count products from stores in this category
  const stores = await Store.find({ category: this._id }, "_id")
  const storeIds = stores.map((store) => store._id)

  this.productCount = await Product.countDocuments({
    store: { $in: storeIds },
    isAvailable: true,
  })

  return this.save()
}

module.exports = mongoose.model("Category", categorySchema)
