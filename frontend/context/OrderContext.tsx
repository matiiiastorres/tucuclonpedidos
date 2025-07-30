"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { CartItem } from "./CartContext"
import type { Location } from "./LocationContext"

export interface Order {
  id: string
  userId: string
  storeId: string
  storeName: string
  items: CartItem[]
  status: "pending" | "confirmed" | "preparing" | "on_way" | "delivered" | "cancelled"
  deliveryAddress: {
    street: string
    city: string
    coordinates: Location
  }
  paymentMethod: "card" | "cash" | "paypal"
  summary: {
    subtotal: number
    deliveryFee: number
    serviceFee: number
    discount: number
    total: number
  }
  estimatedDeliveryTime: number
  actualDeliveryTime?: number
  driverInfo?: {
    name: string
    phone: string
    location: Location
  }
  createdAt: string
  updatedAt: string
  notes?: string
  rating?: number
  review?: string
}

interface OrderContextType {
  orders: Order[]
  activeOrder: Order | null
  isLoading: boolean
  createOrder: (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">) => Promise<string | null>
  getOrderById: (orderId: string) => Order | null
  updateOrderStatus: (orderId: string, status: Order["status"]) => void
  cancelOrder: (orderId: string) => Promise<boolean>
  rateOrder: (orderId: string, rating: number, review?: string) => Promise<boolean>
  trackOrder: (orderId: string) => Order | null
  getOrderHistory: () => Order[]
  reorder: (orderId: string) => Promise<boolean>
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Cargar órdenes del localStorage al iniciar
  useEffect(() => {
    const savedOrders = localStorage.getItem("user_orders")
    if (savedOrders) {
      const parsedOrders = JSON.parse(savedOrders)
      setOrders(parsedOrders)

      // Buscar orden activa (no entregada ni cancelada)
      const active = parsedOrders.find((order: Order) => !["delivered", "cancelled"].includes(order.status))
      setActiveOrder(active || null)
    }
  }, [])

  // Guardar órdenes en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem("user_orders", JSON.stringify(orders))
  }, [orders])

  // Simular actualizaciones de estado en tiempo real
  useEffect(() => {
    if (!activeOrder) return

    const statusFlow: Order["status"][] = ["pending", "confirmed", "preparing", "on_way", "delivered"]
    const currentIndex = statusFlow.indexOf(activeOrder.status)

    if (currentIndex < statusFlow.length - 1) {
      const timer = setTimeout(() => {
        const nextStatus = statusFlow[currentIndex + 1]
        updateOrderStatus(activeOrder.id, nextStatus)

        const statusMessages = {
          confirmed: "Tu pedido ha sido confirmado",
          preparing: "Tu pedido se está preparando",
          on_way: "Tu pedido está en camino",
          delivered: "Tu pedido ha sido entregado",
        }

        toast({
          title: "Estado del pedido actualizado",
          description: statusMessages[nextStatus as keyof typeof statusMessages],
        })
      }, 30000) // Cambiar estado cada 30 segundos para demo

      return () => clearTimeout(timer)
    }
  }, [activeOrder])

  const createOrder = async (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string | null> => {
    try {
      setIsLoading(true)

      // Simular creación de orden
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const orderId = `order_${Date.now()}`
      const newOrder: Order = {
        ...orderData,
        id: orderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        driverInfo: {
          name: "Juan Pérez",
          phone: "+1234567890",
          location: { lat: -34.6037, lng: -58.3816 },
        },
      }

      setOrders((prev) => [newOrder, ...prev])
      setActiveOrder(newOrder)

      toast({
        title: "Pedido creado",
        description: `Tu pedido #${orderId.slice(-6)} ha sido creado exitosamente`,
      })

      return orderId
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el pedido",
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getOrderById = (orderId: string): Order | null => {
    return orders.find((order) => order.id === orderId) || null
  }

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order)),
    )

    // Actualizar orden activa si es la misma
    if (activeOrder?.id === orderId) {
      setActiveOrder((prev) => (prev ? { ...prev, status } : null))

      // Si la orden fue entregada o cancelada, limpiar orden activa
      if (["delivered", "cancelled"].includes(status)) {
        setActiveOrder(null)
      }
    }
  }

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    try {
      const order = getOrderById(orderId)
      if (!order) return false

      // Solo se puede cancelar si está en estado pending o confirmed
      if (!["pending", "confirmed"].includes(order.status)) {
        toast({
          title: "No se puede cancelar",
          description: "El pedido ya está siendo preparado",
          variant: "destructive",
        })
        return false
      }

      updateOrderStatus(orderId, "cancelled")

      toast({
        title: "Pedido cancelado",
        description: "Tu pedido ha sido cancelado exitosamente",
      })

      return true
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar el pedido",
        variant: "destructive",
      })
      return false
    }
  }

  const rateOrder = async (orderId: string, rating: number, review?: string): Promise<boolean> => {
    try {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, rating, review, updatedAt: new Date().toISOString() } : order,
        ),
      )

      toast({
        title: "Calificación enviada",
        description: "Gracias por tu calificación",
      })

      return true
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la calificación",
        variant: "destructive",
      })
      return false
    }
  }

  const trackOrder = (orderId: string): Order | null => {
    return getOrderById(orderId)
  }

  const getOrderHistory = (): Order[] => {
    return orders.filter((order) => ["delivered", "cancelled"].includes(order.status))
  }

  const reorder = async (orderId: string): Promise<boolean> => {
    try {
      const originalOrder = getOrderById(orderId)
      if (!originalOrder) return false

      // Crear nueva orden basada en la original
      const newOrderData: Omit<Order, "id" | "createdAt" | "updatedAt"> = {
        userId: originalOrder.userId,
        storeId: originalOrder.storeId,
        storeName: originalOrder.storeName,
        items: originalOrder.items,
        status: "pending",
        deliveryAddress: originalOrder.deliveryAddress,
        paymentMethod: originalOrder.paymentMethod,
        summary: originalOrder.summary,
        estimatedDeliveryTime: originalOrder.estimatedDeliveryTime,
        notes: originalOrder.notes,
      }

      const newOrderId = await createOrder(newOrderData)
      return newOrderId !== null
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo repetir el pedido",
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrder,
        isLoading,
        createOrder,
        getOrderById,
        updateOrderStatus,
        cancelOrder,
        rateOrder,
        trackOrder,
        getOrderHistory,
        reorder,
      }}
    >
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider")
  }
  return context
}
