"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export interface Location {
  lat: number
  lng: number
}

export interface LocationInfo {
  coordinates: Location
  address: string
  city: string
  state: string
  country: string
  zipCode?: string
}

interface LocationContextType {
  currentLocation: LocationInfo | null
  isLoadingLocation: boolean
  selectedDeliveryLocation: LocationInfo | null
  getCurrentLocation: () => Promise<LocationInfo | null>
  setDeliveryLocation: (location: LocationInfo) => void
  calculateDistance: (from: Location, to: Location) => number
  calculateDeliveryTime: (distance: number) => number
  calculateDeliveryCost: (distance: number) => number
  isLocationInCoverage: (storeLocation: Location, deliveryLocation: Location, coverageRadius: number) => boolean
  geocodeAddress: (address: string) => Promise<LocationInfo | null>
  reverseGeocode: (coordinates: Location) => Promise<LocationInfo | null>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null)
  const [selectedDeliveryLocation, setSelectedDeliveryLocation] = useState<LocationInfo | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Intentar obtener la ubicación actual al cargar
    getCurrentLocation()
  }, [])

  const getCurrentLocation = async (): Promise<LocationInfo | null> => {
    setIsLoadingLocation(true)

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocalización no soportada")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutos
        })
      })

      const coordinates: Location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }

      // Simular reverse geocoding
      const locationInfo: LocationInfo = {
        coordinates,
        address: "Calle Principal 123",
        city: "Buenos Aires",
        state: "CABA",
        country: "Argentina",
        zipCode: "1000",
      }

      setCurrentLocation(locationInfo)

      // Si no hay ubicación de entrega seleccionada, usar la actual
      if (!selectedDeliveryLocation) {
        setSelectedDeliveryLocation(locationInfo)
      }

      return locationInfo
    } catch (error) {
      console.error("Error getting location:", error)

      // Ubicación por defecto (Buenos Aires)
      const defaultLocation: LocationInfo = {
        coordinates: { lat: -34.6037, lng: -58.3816 },
        address: "Buenos Aires, Argentina",
        city: "Buenos Aires",
        state: "CABA",
        country: "Argentina",
      }

      setCurrentLocation(defaultLocation)
      if (!selectedDeliveryLocation) {
        setSelectedDeliveryLocation(defaultLocation)
      }

      toast({
        title: "Ubicación no disponible",
        description: "Usando ubicación por defecto. Puedes cambiarla manualmente.",
        variant: "destructive",
      })

      return defaultLocation
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const setDeliveryLocation = (location: LocationInfo) => {
    setSelectedDeliveryLocation(location)
    toast({
      title: "Ubicación actualizada",
      description: `Entregaremos en: ${location.address}`,
    })
  }

  // Calcular distancia usando la fórmula de Haversine
  const calculateDistance = (from: Location, to: Location): number => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = ((to.lat - from.lat) * Math.PI) / 180
    const dLng = ((to.lng - from.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Calcular tiempo estimado de entrega (en minutos)
  const calculateDeliveryTime = (distance: number): number => {
    // Tiempo base + tiempo por distancia
    const baseTime = 15 // 15 minutos base
    const timePerKm = 3 // 3 minutos por km
    return Math.round(baseTime + distance * timePerKm)
  }

  // Calcular costo de envío
  const calculateDeliveryCost = (distance: number): number => {
    const baseCost = 2.5 // Costo base
    const costPerKm = 0.75 // Costo por km

    if (distance <= 2) return baseCost
    return baseCost + (distance - 2) * costPerKm
  }

  // Verificar si la ubicación está dentro del área de cobertura
  const isLocationInCoverage = (
    storeLocation: Location,
    deliveryLocation: Location,
    coverageRadius: number,
  ): boolean => {
    const distance = calculateDistance(storeLocation, deliveryLocation)
    return distance <= coverageRadius
  }

  // Geocodificar dirección (convertir dirección a coordenadas)
  const geocodeAddress = async (address: string): Promise<LocationInfo | null> => {
    try {
      // Simular geocoding API
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Coordenadas simuladas para Buenos Aires
      const mockLocation: LocationInfo = {
        coordinates: {
          lat: -34.6037 + (Math.random() - 0.5) * 0.1,
          lng: -58.3816 + (Math.random() - 0.5) * 0.1,
        },
        address,
        city: "Buenos Aires",
        state: "CABA",
        country: "Argentina",
      }

      return mockLocation
    } catch (error) {
      console.error("Error geocoding address:", error)
      return null
    }
  }

  // Geocodificación inversa (convertir coordenadas a dirección)
  const reverseGeocode = async (coordinates: Location): Promise<LocationInfo | null> => {
    try {
      // Simular reverse geocoding API
      await new Promise((resolve) => setTimeout(resolve, 500))

      const mockLocation: LocationInfo = {
        coordinates,
        address: `Calle ${Math.floor(Math.random() * 1000)} ${Math.floor(Math.random() * 100)}`,
        city: "Buenos Aires",
        state: "CABA",
        country: "Argentina",
      }

      return mockLocation
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      return null
    }
  }

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isLoadingLocation,
        selectedDeliveryLocation,
        getCurrentLocation,
        setDeliveryLocation,
        calculateDistance,
        calculateDeliveryTime,
        calculateDeliveryCost,
        isLocationInCoverage,
        geocodeAddress,
        reverseGeocode,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider")
  }
  return context
}
