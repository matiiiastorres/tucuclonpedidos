import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
      window.location.href = "/auth/login"
    }
    return Promise.reject(error)
  },
)

// API functions
export const authAPI = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  register: (userData: any) => api.post("/auth/register", userData),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data: any) => api.put("/auth/profile", data),
  changePassword: (data: any) => api.put("/auth/change-password", data),
}

export const storesAPI = {
  getStores: (params?: any) => api.get("/stores", { params }),
  getStore: (id: string) => api.get(`/stores/${id}`),
  createStore: (data: any) => api.post("/stores", data),
  updateStore: (id: string, data: any) => api.put(`/stores/${id}`, data),
  getFeatured: () => api.get("/stores/featured/list"),
}

export const ordersAPI = {
  createOrder: (data: any) => api.post("/orders", data),
  getOrders: (params?: any) => api.get("/orders", { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
  cancelOrder: (id: string, reason?: string) => api.put(`/orders/${id}/cancel`, { reason }),
  rateOrder: (id: string, rating: any) => api.post(`/orders/${id}/rate`, rating),
}
