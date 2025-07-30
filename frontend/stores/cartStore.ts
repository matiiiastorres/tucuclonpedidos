import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Cart, Product, Address } from '@/types'
import { cartAPI } from '@/services/api'

interface CartState {
  carts: Record<string, Cart> // keyed by storeId
  isLoading: boolean
  error: string | null
  
  // Actions
  getCart: (storeId: string) => Promise<Cart>
  addToCart: (storeId: string, product: Product, quantity: number, options?: {
    customizations?: any[]
    addons?: any[]
    specialInstructions?: string
  }) => Promise<void>
  updateCartItem: (storeId: string, itemId: string, quantity: number) => Promise<void>
  removeCartItem: (storeId: string, itemId: string) => Promise<void>
  clearCart: (storeId: string) => Promise<void>
  applyCoupon: (storeId: string, couponCode: string) => Promise<void>
  removeCoupon: (storeId: string) => Promise<void>
  updateDeliveryAddress: (storeId: string, address: Address) => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  
  // Getters
  getCartItemCount: (storeId: string) => number
  getCartTotal: (storeId: string) => number
  hasCartItems: (storeId: string) => boolean
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},
      isLoading: false,
      error: null,

      getCart: async (storeId: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await cartAPI.getCart(storeId)
          
          if (response.success && response.data) {
            const cart = response.data
            
            set((state) => ({
              carts: {
                ...state.carts,
                [storeId]: cart,
              },
              isLoading: false,
              error: null,
            }))
            
            return cart
          } else {
            throw new Error(response.message || 'Failed to get cart')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Failed to get cart',
          })
          throw error
        }
      },

      addToCart: async (storeId: string, product: Product, quantity: number, options = {}) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await cartAPI.addToCart(storeId, {
            productId: product._id,
            quantity,
            customizations: options.customizations || [],
            addons: options.addons || [],
            specialInstructions: options.specialInstructions,
          })
          
          if (response.success && response.data) {
            const cart = response.data
            
            set((state) => ({
              carts: {
                ...state.carts,
                [storeId]: cart,
              },
              isLoading: false,
              error: null,
            }))
          } else {
            throw new Error(response.message || 'Failed to add to cart')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Failed to add to cart',
          })
          throw error
        }
      },

      updateCartItem: async (storeId: string, itemId: string, quantity: number) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await cartAPI.updateCartItem(storeId, itemId, quantity)
          
          if (response.success && response.data) {
            const cart = response.data
            
            set((state) => ({
              carts: {
                ...state.carts,
                [storeId]: cart,
              },
              isLoading: false,
              error: null,
            }))
          } else {
            throw new Error(response.message || 'Failed to update cart item')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Failed to update cart item',
          })
          throw error
        }
      },

      removeCartItem: async (storeId: string, itemId: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await cartAPI.removeCartItem(storeId, itemId)
          
          if (response.success && response.data) {
            const cart = response.data
            
            set((state) => ({
              carts: {
                ...state.carts,
                [storeId]: cart,
              },
              isLoading: false,
              error: null,
            }))
          } else {
            throw new Error(response.message || 'Failed to remove cart item')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Failed to remove cart item',
          })
          throw error
        }
      },

      clearCart: async (storeId: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await cartAPI.clearCart(storeId)
          
          if (response.success) {
            set((state) => ({
              carts: {
                ...state.carts,
                [storeId]: response.data,
              },
              isLoading: false,
              error: null,
            }))
          } else {
            throw new Error(response.message || 'Failed to clear cart')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Failed to clear cart',
          })
          throw error
        }
      },

      applyCoupon: async (storeId: string, couponCode: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await cartAPI.applyCoupon(storeId, couponCode)
          
          if (response.success && response.data) {
            const cart = response.data
            
            set((state) => ({
              carts: {
                ...state.carts,
                [storeId]: cart,
              },
              isLoading: false,
              error: null,
            }))
          } else {
            throw new Error(response.message || 'Failed to apply coupon')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Failed to apply coupon',
          })
          throw error
        }
      },

      removeCoupon: async (storeId: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await cartAPI.removeCoupon(storeId)
          
          if (response.success && response.data) {
            const cart = response.data
            
            set((state) => ({
              carts: {
                ...state.carts,
                [storeId]: cart,
              },
              isLoading: false,
              error: null,
            }))
          } else {
            throw new Error(response.message || 'Failed to remove coupon')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Failed to remove coupon',
          })
          throw error
        }
      },

      updateDeliveryAddress: async (storeId: string, address: Address) => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await cartAPI.updateDeliveryAddress(storeId, address)
          
          if (response.success && response.data) {
            const cart = response.data
            
            set((state) => ({
              carts: {
                ...state.carts,
                [storeId]: cart,
              },
              isLoading: false,
              error: null,
            }))
          } else {
            throw new Error(response.message || 'Failed to update delivery address')
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Failed to update delivery address',
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

      // Getters
      getCartItemCount: (storeId: string) => {
        const state = get()
        const cart = state.carts[storeId]
        if (!cart || !cart.items) return 0
        return cart.items.reduce((total, item) => total + item.quantity, 0)
      },

      getCartTotal: (storeId: string) => {
        const state = get()
        const cart = state.carts[storeId]
        return cart?.total || 0
      },

      hasCartItems: (storeId: string) => {
        const state = get()
        const cart = state.carts[storeId]
        return cart?.items?.length > 0 || false
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        carts: state.carts,
      }),
    }
  )
)