"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  storeId: string
  storeName: string
  options?: {
    size?: string
    extras?: string[]
    notes?: string
  }
}

export interface CartSummary {
  subtotal: number
  deliveryFee: number
  serviceFee: number
  discount: number
  total: number
  itemCount: number
}

interface CartContextType {
  items: CartItem[]
  summary: CartSummary
  storeId: string | null
  addItem: (item: Omit<CartItem, "id">) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (code: string) => Promise<boolean>
  removeCoupon: () => void
  currentCoupon: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [storeId, setStoreId] = useState<string | null>(null)
  const [currentCoupon, setCurrentCoupon] = useState<string | null>(null)
  const { toast } = useToast()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart_items")
    const savedStoreId = localStorage.getItem("cart_store_id")
    const savedCoupon = localStorage.getItem("cart_coupon")

    if (savedCart) {
      setItems(JSON.parse(savedCart))
    }
    if (savedStoreId) {
      setStoreId(savedStoreId)
    }
    if (savedCoupon) {
      setCurrentCoupon(savedCoupon)
    }
  }, [])

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cart_items", JSON.stringify(items))
    if (storeId) {
      localStorage.setItem("cart_store_id", storeId)
    }
  }, [items, storeId])

  // Calculate cart summary
  const summary: CartSummary = React.useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const deliveryFee = subtotal > 0 ? 2.5 : 0
    const serviceFee = subtotal * 0.05 // 5% service fee

    let discount = 0
    if (currentCoupon) {
      // Simple coupon logic
      if (currentCoupon === "FIRST10") discount = subtotal * 0.1
      if (currentCoupon === "SAVE5") discount = 5
    }

    const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      subtotal,
      deliveryFee,
      serviceFee,
      discount,
      total,
      itemCount,
    }
  }, [items, currentCoupon])

  const addItem = (newItem: Omit<CartItem, "id">) => {
    // Check if it's from the same store
    if (storeId && storeId !== newItem.storeId) {
      toast({
        title: "Tienda diferente",
        description: "Solo puedes pedir de una tienda a la vez. ¿Quieres limpiar el carrito?",
        variant: "destructive",
      })
      return
    }

    const itemId = `${newItem.productId}_${Date.now()}`
    const cartItem: CartItem = {
      ...newItem,
      id: itemId,
    }

    setItems((prev) => [...prev, cartItem])
    setStoreId(newItem.storeId)

    toast({
      title: "Producto agregado",
      description: `${newItem.name} ha sido agregado al carrito`,
    })
  }

  const removeItem = (itemId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.id !== itemId)

      // If no items left, clear storeId
      if (newItems.length === 0) {
        setStoreId(null)
        localStorage.removeItem("cart_store_id")
      }

      return newItems
    })

    toast({
      title: "Producto eliminado",
      description: "El producto ha sido eliminado del carrito",
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    setStoreId(null)
    setCurrentCoupon(null)
    localStorage.removeItem("cart_items")
    localStorage.removeItem("cart_store_id")
    localStorage.removeItem("cart_coupon")

    toast({
      title: "Carrito limpiado",
      description: "Todos los productos han sido eliminados",
    })
  }

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      // Simulate coupon validation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const validCoupons = ["FIRST10", "SAVE5", "WELCOME20"]

      if (validCoupons.includes(code.toUpperCase())) {
        setCurrentCoupon(code.toUpperCase())
        localStorage.setItem("cart_coupon", code.toUpperCase())

        toast({
          title: "Cupón aplicado",
          description: `El cupón ${code} ha sido aplicado correctamente`,
        })

        return true
      } else {
        toast({
          title: "Cupón inválido",
          description: "El cupón ingresado no es válido o ha expirado",
          variant: "destructive",
        })

        return false
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aplicar el cupón",
        variant: "destructive",
      })
      return false
    }
  }

  const removeCoupon = () => {
    setCurrentCoupon(null)
    localStorage.removeItem("cart_coupon")

    toast({
      title: "Cupón removido",
      description: "El cupón ha sido removido del pedido",
    })
  }

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        storeId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        currentCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
