"use client"

import { useState } from "react"
import { MapPin, Search, Navigation, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InteractiveMap } from "./InteractiveMap"
import { useLocation, type Location, type LocationInfo } from "@/context/LocationContext"

interface LocationPickerProps {
  onLocationSelect: (location: LocationInfo) => void
  onClose?: () => void
  initialLocation?: Location
  title?: string
}

export function LocationPicker({
  onLocationSelect,
  onClose,
  initialLocation,
  title = "Seleccionar ubicación",
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([])
  const [selectedCoordinates, setSelectedCoordinates] = useState<Location | null>(initialLocation || null)

  const { currentLocation, geocodeAddress, reverseGeocode, getCurrentLocation, isLoadingLocation } = useLocation()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const result = await geocodeAddress(searchQuery)
      if (result) {
        setSearchResults([result])
        setSelectedCoordinates(result.coordinates)
      } else {
        setSearchResults([])
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleMapLocationSelect = async (coordinates: Location) => {
    setSelectedCoordinates(coordinates)

    // Obtener información de la dirección
    const locationInfo = await reverseGeocode(coordinates)
    if (locationInfo) {
      setSearchResults([locationInfo])
    }
  }

  const handleLocationConfirm = (location: LocationInfo) => {
    onLocationSelect(location)
    onClose?.()
  }

  const handleUseCurrentLocation = async () => {
    const location = await getCurrentLocation()
    if (location) {
      handleLocationConfirm(location)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {title}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar dirección..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {/* Botón de ubicación actual */}
        <Button
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isLoadingLocation}
          className="w-full bg-transparent"
        >
          <Navigation className="w-4 h-4 mr-2" />
          {isLoadingLocation ? "Obteniendo ubicación..." : "Usar mi ubicación actual"}
        </Button>

        {/* Mapa interactivo */}
        <InteractiveMap
          center={selectedCoordinates || currentLocation?.coordinates}
          onLocationSelect={handleMapLocationSelect}
          showCurrentLocation={true}
          className="w-full"
        />

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Resultados:</h3>
            {searchResults.map((result, index) => (
              <Card key={index} className="cursor-pointer hover:bg-gray-50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{result.address}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.city}, {result.state}, {result.country}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleLocationConfirm(result)}>
                      Seleccionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Información de coordenadas seleccionadas */}
        {selectedCoordinates && searchResults.length === 0 && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Ubicación seleccionada</div>
                  <div className="text-sm text-gray-600">
                    {selectedCoordinates.lat.toFixed(6)}, {selectedCoordinates.lng.toFixed(6)}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    const locationInfo = await reverseGeocode(selectedCoordinates)
                    if (locationInfo) {
                      handleLocationConfirm(locationInfo)
                    }
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
