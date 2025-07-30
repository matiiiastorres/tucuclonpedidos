import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginForm, RegisterForm } from '@/types'
import { authAPI } from '@/services/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginForm) => Promise<void>
  register: (userData: RegisterForm) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginForm) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authAPI.login(credentials)
          
          if (response.success && response.data) {
            const { user, token } = response.data
            
            // Store token in localStorage
            localStorage.setItem('token', token)
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(response.message || 'Login failed')
          }
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Login failed',
          })
          throw error
        }
      },

      register: async (userData: RegisterForm) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authAPI.register(userData)
          
          if (response.success && response.data) {
            const { user, token } = response.data
            
            // Store token in localStorage
            localStorage.setItem('token', token)
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(response.message || 'Registration failed')
          }
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Registration failed',
          })
          throw error
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint if user is authenticated
          if (get().isAuthenticated) {
            await authAPI.logout()
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear token from localStorage
          localStorage.removeItem('token')
          
          // Clear state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token')
          
          if (!token) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            })
            return
          }

          set({ isLoading: true })
          
          const response = await authAPI.getProfile()
          
          if (response.success && response.data) {
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } else {
            // Invalid token, clear auth state
            localStorage.removeItem('token')
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          }
        } catch (error: any) {
          // Token is invalid or expired
          localStorage.removeItem('token')
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },

      updateProfile: async (userData: Partial<User>) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await authAPI.updateProfile(userData)
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error(response.message || 'Profile update failed')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Profile update failed',
          })
          throw error
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)