// User Types
export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'client' | 'store_owner' | 'admin' | 'delivery_driver'
  avatar?: string
  addresses: Address[]
  favoriteStores: string[]
  loyaltyPoints: number
  isActive: boolean
  emailVerified: boolean
  phoneVerified: boolean
  lastLogin?: Date
  preferences: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    dietary: string[]
    language: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  _id?: string
  label: string
  street: string
  city: string
  state: string
  zipCode?: string
  country: string
  coordinates: {
    lat: number
    lng: number
  }
  isDefault: boolean
  instructions?: string
}

// Store Types
export interface Store {
  _id: string
  name: string
  description: string
  logo?: string
  coverImage?: string
  owner: string | User
  category: string | Category
  subcategories: string[]
  cuisine: string[]
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
    deliveryRadius: number
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  businessHours: BusinessHours[]
  deliveryInfo: {
    deliveryFee: number
    freeDeliveryMinOrder: number
    estimatedDeliveryTime: string
    deliveryAreas: string[]
  }
  averageRating: number
  totalReviews: number
  isActive: boolean
  isOpen: boolean
  isFeatured: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface BusinessHours {
  day: string
  openTime: string
  closeTime: string
  isOpen: boolean
}

// Product Types
export interface Product {
  _id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string | Category
  store: string | Store
  customizations: Customization[]
  addons: Addon[]
  nutritionalInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  allergens: string[]
  dietary: string[]
  isAvailable: boolean
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  prepTime: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Customization {
  name: string
  type: 'single' | 'multiple'
  required: boolean
  options: {
    name: string
    price: number
  }[]
}

export interface Addon {
  name: string
  price: number
  category?: string
}

// Category Types
export interface Category {
  _id: string
  name: string
  description?: string
  image?: string
  icon?: string
  isActive: boolean
  sortOrder: number
  parentCategory?: string
  subcategories: string[]
  storeCount?: number
}

// Cart Types
export interface CartItem {
  _id?: string
  product: Product
  quantity: number
  customizations: {
    name: string
    options: string[]
    price: number
  }[]
  addons: {
    name: string
    price: number
    quantity: number
  }[]
  specialInstructions?: string
  price: number
  totalPrice: number
}

export interface Cart {
  _id: string
  user: string
  store: Store
  items: CartItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  serviceFee: number
  discount: number
  total: number
  appliedCoupon?: {
    code: string
    discountAmount: number
    couponId: string
  }
  deliveryAddress?: Address
  scheduledDelivery?: {
    date: Date
    timeSlot: string
  }
  isActive: boolean
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

// Order Types
export interface Order {
  _id: string
  orderNumber: string
  user: string | User
  store: string | Store
  items: OrderItem[]
  pricing: {
    subtotal: number
    tax: number
    deliveryFee: number
    serviceFee: number
    discount: number
    total: number
  }
  appliedCoupon?: {
    code: string
    discountAmount: number
  }
  deliveryAddress: Address
  paymentMethod: PaymentMethod
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  status: OrderStatus
  estimatedDeliveryTime?: Date
  actualDeliveryTime?: Date
  notes?: string
  deliveryDriver?: string | User
  tracking?: {
    orderPlaced: Date
    orderConfirmed?: Date
    preparingOrder?: Date
    outForDelivery?: Date
    delivered?: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  product: string | Product
  name: string
  price: number
  quantity: number
  customizations: {
    name: string
    options: string[]
    price: number
  }[]
  addons: {
    name: string
    price: number
    quantity: number
  }[]
  specialInstructions?: string
  totalPrice: number
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface PaymentMethod {
  type: 'cash' | 'card' | 'paypal' | 'apple_pay' | 'google_pay'
  details?: {
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
  }
}

// Review Types
export interface Review {
  _id: string
  user: string | User
  store: string | Store
  order: string | Order
  rating: number
  comment?: string
  images: {
    url: string
    publicId: string
  }[]
  foodQuality?: number
  deliveryTime?: number
  customerService?: number
  isApproved: boolean
  isReported: boolean
  reportCount: number
  storeResponse?: {
    message: string
    respondedAt: Date
    respondedBy: string | User
  }
  helpfulVotes: number
  votedUsers: string[]
  createdAt: Date
  updatedAt: Date
}

// Coupon Types
export interface Coupon {
  _id: string
  code: string
  title: string
  description?: string
  discountType: 'percentage' | 'fixed' | 'freeDelivery'
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount: number
  maxUsage?: number
  maxUsagePerUser: number
  usageCount: number
  startDate: Date
  endDate: Date
  applicableStores: string[]
  applicableCategories: string[]
  applicableProducts: string[]
  eligibleUsers: string[]
  newUsersOnly: boolean
  isActive: boolean
  createdBy: string
  usedBy: {
    user: string
    order: string
    usedAt: Date
    discountApplied: number
  }[]
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: any[]
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    docs: T[]
    totalDocs: number
    limit: number
    totalPages: number
    page: number
    pagingCounter: number
    hasPrevPage: boolean
    hasNextPage: boolean
    prevPage?: number
    nextPage?: number
  }
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  category?: string
  cuisine?: string[]
  priceRange?: {
    min: number
    max: number
  }
  rating?: number
  deliveryTime?: number
  dietary?: string[]
  sortBy?: 'relevance' | 'rating' | 'delivery_time' | 'price_low' | 'price_high'
  location?: {
    lat: number
    lng: number
    radius: number
  }
}

// Notification Types
export interface Notification {
  _id: string
  user: string
  type: 'order_update' | 'promotion' | 'system' | 'review'
  title: string
  message: string
  data?: any
  isRead: boolean
  createdAt: Date
}

// App State Types
export interface AppError {
  message: string
  code?: string
  details?: any
}

export interface LoadingState {
  isLoading: boolean
  message?: string
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
  role?: 'client' | 'store_owner'
}

export interface AddressForm {
  label: string
  street: string
  city: string
  state: string
  zipCode?: string
  country: string
  coordinates: {
    lat: number
    lng: number
  }
  instructions?: string
  isDefault?: boolean
}

export interface CheckoutForm {
  deliveryAddress: Address
  paymentMethod: PaymentMethod
  scheduledDelivery?: {
    date: Date
    timeSlot: string
  }
  notes?: string
  couponCode?: string
}

// Socket.IO Event Types
export interface SocketEvents {
  'order-status-updated': (data: { orderId: string; status: OrderStatus; estimatedTime?: string }) => void
  'delivery-location-updated': (data: { lat: number; lng: number }) => void
  'new-order': (order: Order) => void
  'order-cancelled': (data: { orderId: string; reason: string }) => void
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type WithTimestamps<T> = T & {
  createdAt: Date
  updatedAt: Date
}