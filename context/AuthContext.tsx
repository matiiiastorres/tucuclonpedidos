"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { authAPI } from "@/lib/api"

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: "client" | "store_owner" | "admin" | "delivery_driver"
  avatar?: string
  addresses: Address[]
  favoriteStores: string[]
  loyaltyPoints: number
  createdAt: string
}

export interface Address {
  id: string
  label: string
  street: string
  city: string
  state: string
  zipCode: string
  coordinates: {
    lat: number
    lng: number
  }
  isDefault: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<boolean>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  role?: "client" | "store_owner"
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (token) {
        const response = await authAPI.getMe()
        setUser(response.data.data.user)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await authAPI.login(email, password)

      const { user, token } = response.data.data

      localStorage.setItem("auth_token", token)
      localStorage.setItem("user_data", JSON.stringify(user))
      setUser(user)

      toast({
        title: "Bienvenido",
        description: `Hola ${user.name}, has iniciado sesión correctamente`,
      })

      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al iniciar sesión",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await authAPI.register(userData)

      const { user, token } = response.data.data

      localStorage.setItem("auth_token", token)
      localStorage.setItem("user_data", JSON.stringify(user))
      setUser(user)

      toast({
        title: "Cuenta creada",
        description: "Tu cuenta ha sido creada exitosamente",
      })

      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear la cuenta",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setUser(null)
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    })
  }

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await authAPI.updateProfile(data)
      const updatedUser = response.data.data.user

      localStorage.setItem("user_data", JSON.stringify(updatedUser))
      setUser(updatedUser)

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente",
      })

      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al actualizar el perfil",
        variant: "destructive",
      })
      return false
    }
  }

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe()
      setUser(response.data.data.user)
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
