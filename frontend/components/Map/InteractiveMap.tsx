"use client"

import type React from "react"
import { useState, useRef } from "react"
import { MapPin, Navigation, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLocation, type Location } from "@/context/LocationContext"

interface MapProps {
  center?: Location
  zoom?: number
  markers?: MapMarker[]
  onLocationSelect?: (location: Location) => void
  showCurrentLocation?: boolean
  showStores?: boolean
  className?: string
}

interface MapMarker {
  id: string
  position: Location
  title: string
  type: "store" | "user" | "delivery"
  info?: string
}

export function InteractiveMap({
  center,
  zoom = 13,
  markers = [],
  onLocationSelect,
  showCurrentLocation = true,
  showStores = false,
  className = "",
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { currentLocation, getCurrentLocation } = useLocation()

  // Simular mapa interactivo con clicks
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onLocationSelect) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convertir coordenadas de pixel a lat/lng (simulado)
    const lat = center?.lat || (currentLocation?.coordinates.lat ?? -34.6037)
    const lng = center?.lng || (currentLocation?.coordinates.lng ?? -58.3816)

    // Simular variación basada en la posición del click
    const latOffset = ((y - rect.height / 2) / rect.height) * 0.01
    const lngOffset = ((x - rect.width / 2) / rect.width) * 0.01

    const newLocation: Location = {
      lat: lat - latOffset,
      lng: lng + lngOffset,
    }

    setSelectedLocation(newLocation)
    onLocationSelect(newLocation)
  }

  const handleGetCurrentLocation = async () => {
    setIsLoading(true)
    try {
      const location = await getCurrentLocation()
      if (location && onLocationSelect) {
        onLocationSelect(location.coordinates)
        setSelectedLocation(location.coordinates)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Card className="overflow-hidden">
        {/* Mapa simulado */}
        <div
          ref={mapRef}
          className="w-full h-64 md:h-96 bg-gradient-to-br from-green-100 to-blue-100 relative cursor-crosshair map-container"
          onClick={handleMapClick}
        >
          {/* Grid de calles simulado */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full h-px bg-gray-400" style={{ top: `${i * 10}%` }} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full w-px bg-gray-400" style={{ left: `${i * 10}%` }} />
            ))}
          </div>

          {/* Marcador de ubicación actual */}
          {showCurrentLocation && currentLocation && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: "50%",
                top: "50%",
              }}
            >
              <div className="location-marker animate-pulse">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded whitespace-nowrap">
                Tu ubicación
              </div>
            </div>
          )}

          {/* Marcadores de tiendas */}
          {markers.map((marker, index) => (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: `${30 + index * 15}%`,
                top: `${25 + index * 20}%`,
              }}
            >
              <div className={`store-marker ${marker.type === "store" ? "bg-green-500" : "bg-blue-500"}`}>
                {marker.type === "store" ? <Store className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded whitespace-nowrap">
                {marker.title}
              </div>
            </div>
          ))}

          {/* Marcador de ubicación seleccionada */}
          {selectedLocation && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{
                left: "60%",
                top: "40%",
              }}
            >
              <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg animate-bounce">
                <MapPin className="w-4 h-4 text-white ml-0.5" />
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-red-500 text-white px-2 py-1 rounded whitespace-nowrap">
                Ubicación seleccionada
              </div>
            </div>
          )}

          {/* Controles del mapa */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="shadow-lg"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>

          {/* Indicador de zoom */}
          <div className="absolute bottom-4 left-4 bg-white/90 px-2 py-1 rounded text-xs">Zoom: {zoom}</div>
        </div>

        {/* Información de la ubicación seleccionada */}
        {selectedLocation && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>
                Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Instrucciones */}
      {onLocationSelect && (
        <p className="text-sm text-gray-600 mt-2 text-center">Haz clic en el mapa para seleccionar una ubicación</p>
      )}
    </div>
  )
}
