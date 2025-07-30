import axios, { AxiosResponse, AxiosError } from 'axios'
import { 
  User, 
  Store, 
  Product, 
  Category, 
  Cart, 
  Order, 
  Review, 
  Coupon, 
  ApiResponse, 
  PaginatedResponse,
  SearchFilters,
  LoginForm,
  RegisterForm,
  Address,
  CheckoutForm
} from '@/types'

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (userData: RegisterForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/auth/profile', userData)
    return response.data
  },

  changePassword: async (passwordData: {
    currentPassword: string
    newPassword: string
  }): Promise<ApiResponse> => {
    const response = await api.put('/auth/change-password', passwordData)
    return response.data
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },
}

// Users API
export const usersAPI = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/users/profile')
    return response.data
  },

  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/profile', userData)
    return response.data
  },

  addAddress: async (address: Address): Promise<ApiResponse<User>> => {
    const response = await api.post('/users/addresses', address)
    return response.data
  },

  updateAddress: async (addressId: string, address: Partial<Address>): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/addresses/${addressId}`, address)
    return response.data
  },

  deleteAddress: async (addressId: string): Promise<ApiResponse<User>> => {
    const response = await api.delete(`/users/addresses/${addressId}`)
    return response.data
  },

  addFavoriteStore: async (storeId: string): Promise<ApiResponse> => {
    const response = await api.post(`/users/favorites/${storeId}`)
    return response.data
  },

  removeFavoriteStore: async (storeId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/users/favorites/${storeId}`)
    return response.data
  },

  getFavoriteStores: async (): Promise<ApiResponse<Store[]>> => {
    const response = await api.get('/users/favorites')
    return response.data
  },
}

// Stores API
export const storesAPI = {
  getStores: async (params?: {
    page?: number
    limit?: number
    category?: string
    search?: string
    latitude?: number
    longitude?: number
    radius?: number
  }): Promise<PaginatedResponse<Store>> => {
    const response = await api.get('/stores', { params })
    return response.data
  },

  getStore: async (storeId: string): Promise<ApiResponse<Store>> => {
    const response = await api.get(`/stores/${storeId}`)
    return response.data
  },

  getFeaturedStores: async (): Promise<ApiResponse<Store[]>> => {
    const response = await api.get('/stores/featured/list')
    return response.data
  },

  getNearbyStores: async (lat: number, lng: number, radius: number = 10): Promise<ApiResponse<Store[]>> => {
    const response = await api.get('/stores/nearby', {
      params: { lat, lng, radius }
    })
    return response.data
  },

  searchStores: async (filters: SearchFilters): Promise<PaginatedResponse<Store>> => {
    const response = await api.get('/stores/search', { params: filters })
    return response.data
  },

  getStoreProducts: async (storeId: string, params?: {
    page?: number
    limit?: number
    category?: string
  }): Promise<PaginatedResponse<Product>> => {
    const response = await api.get(`/stores/${storeId}/products`, { params })
    return response.data
  },
}

// Products API
export const productsAPI = {
  getProducts: async (params?: {
    page?: number
    limit?: number
    category?: string
    store?: string
    search?: string
  }): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params })
    return response.data
  },

  getProduct: async (productId: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/${productId}`)
    return response.data
  },

  searchProducts: async (filters: SearchFilters): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products/search', { params: filters })
    return response.data
  },
}

// Categories API
export const categoriesAPI = {
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories')
    return response.data
  },

  getCategory: async (categoryId: string): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/${categoryId}`)
    return response.data
  },
}

// Cart API
export const cartAPI = {
  getCart: async (storeId: string): Promise<ApiResponse<Cart>> => {
    const response = await api.get(`/cart/${storeId}`)
    return response.data
  },

  addToCart: async (storeId: string, item: {
    productId: string
    quantity: number
    customizations?: any[]
    addons?: any[]
    specialInstructions?: string
  }): Promise<ApiResponse<Cart>> => {
    const response = await api.post(`/cart/${storeId}/items`, item)
    return response.data
  },

  updateCartItem: async (storeId: string, itemId: string, quantity: number): Promise<ApiResponse<Cart>> => {
    const response = await api.put(`/cart/${storeId}/items/${itemId}`, { quantity })
    return response.data
  },

  removeCartItem: async (storeId: string, itemId: string): Promise<ApiResponse<Cart>> => {
    const response = await api.delete(`/cart/${storeId}/items/${itemId}`)
    return response.data
  },

  clearCart: async (storeId: string): Promise<ApiResponse<Cart>> => {
    const response = await api.delete(`/cart/${storeId}`)
    return response.data
  },

  applyCoupon: async (storeId: string, couponCode: string): Promise<ApiResponse<Cart>> => {
    const response = await api.post(`/cart/${storeId}/coupon`, { couponCode })
    return response.data
  },

  removeCoupon: async (storeId: string): Promise<ApiResponse<Cart>> => {
    const response = await api.delete(`/cart/${storeId}/coupon`)
    return response.data
  },

  updateDeliveryAddress: async (storeId: string, address: Address): Promise<ApiResponse<Cart>> => {
    const response = await api.put(`/cart/${storeId}/delivery-address`, { address })
    return response.data
  },
}

// Orders API
export const ordersAPI = {
  createOrder: async (checkoutData: CheckoutForm): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders', checkoutData)
    return response.data
  },

  getOrders: async (params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/orders', { params })
    return response.data
  },

  getOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${orderId}`)
    return response.data
  },

  cancelOrder: async (orderId: string, reason: string): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/orders/${orderId}/cancel`, { reason })
    return response.data
  },

  trackOrder: async (orderId: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${orderId}/track`)
    return response.data
  },

  rateOrder: async (orderId: string, rating: number): Promise<ApiResponse<Order>> => {
    const response = await api.put(`/orders/${orderId}/rate`, { rating })
    return response.data
  },
}

// Reviews API
export const reviewsAPI = {
  getStoreReviews: async (storeId: string, params?: {
    page?: number
    limit?: number
    rating?: number
    sortBy?: string
  }): Promise<PaginatedResponse<Review>> => {
    const response = await api.get(`/reviews/store/${storeId}`, { params })
    return response.data
  },

  getUserReviews: async (params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ reviews: Review[]; pagination: any }>> => {
    const response = await api.get('/reviews/my-reviews', { params })
    return response.data
  },

  createReview: async (reviewData: {
    orderId: string
    storeId: string
    rating: number
    comment?: string
    foodQuality?: number
    deliveryTime?: number
    customerService?: number
  }): Promise<ApiResponse<Review>> => {
    const response = await api.post('/reviews', reviewData)
    return response.data
  },

  updateReview: async (reviewId: string, reviewData: Partial<Review>): Promise<ApiResponse<Review>> => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData)
    return response.data
  },

  deleteReview: async (reviewId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/reviews/${reviewId}`)
    return response.data
  },

  voteHelpful: async (reviewId: string): Promise<ApiResponse<{ helpfulVotes: number; hasVoted: boolean }>> => {
    const response = await api.post(`/reviews/${reviewId}/helpful`)
    return response.data
  },

  reportReview: async (reviewId: string): Promise<ApiResponse> => {
    const response = await api.post(`/reviews/${reviewId}/report`)
    return response.data
  },

  getCanReviewOrders: async (): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/reviews/can-review')
    return response.data
  },

  getStoreReviewStats: async (storeId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/reviews/store/${storeId}/stats`)
    return response.data
  },
}

// Coupons API
export const couponsAPI = {
  getCoupons: async (storeId?: string): Promise<ApiResponse<Coupon[]>> => {
    const response = await api.get('/coupons', { params: { storeId } })
    return response.data
  },

  validateCoupon: async (code: string, orderAmount: number, storeId?: string): Promise<ApiResponse<{
    coupon: Coupon
    discountAmount: number
    finalAmount: number
  }>> => {
    const response = await api.post('/coupons/validate', { code, orderAmount, storeId })
    return response.data
  },
}

// Location API
export const locationAPI = {
  geocodeAddress: async (address: string): Promise<ApiResponse<{
    lat: number
    lng: number
    formattedAddress: string
  }>> => {
    const response = await api.post('/location/geocode', { address })
    return response.data
  },

  reverseGeocode: async (lat: number, lng: number): Promise<ApiResponse<{
    address: string
    components: any
  }>> => {
    const response = await api.post('/location/reverse-geocode', { lat, lng })
    return response.data
  },

  getCurrentLocation: (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'))
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      }
    })
  },
}

// Upload API
export const uploadAPI = {
  uploadImage: async (file: File): Promise<ApiResponse<{ url: string; publicId: string }>> => {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  uploadMultipleImages: async (files: File[]): Promise<ApiResponse<{ url: string; publicId: string }[]>> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })
    
    const response = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

// Admin API (for admin dashboard)
export const adminAPI = {
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/admin/dashboard')
    return response.data
  },

  getUsers: async (params?: {
    page?: number
    limit?: number
    role?: string
    search?: string
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<ApiResponse<User>> => {
    const response = await api.put(`/admin/users/${userId}/status`, { isActive })
    return response.data
  },

  getStores: async (params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }): Promise<PaginatedResponse<Store>> => {
    const response = await api.get('/admin/stores', { params })
    return response.data
  },

  approveStore: async (storeId: string): Promise<ApiResponse<Store>> => {
    const response = await api.put(`/admin/stores/${storeId}/approve`)
    return response.data
  },

  getOrders: async (params?: {
    page?: number
    limit?: number
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/admin/orders', { params })
    return response.data
  },
}

// Export the main api instance for custom requests
export default api