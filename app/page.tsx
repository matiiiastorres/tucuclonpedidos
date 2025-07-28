"use client"

import { useState } from "react"
import { Search, MapPin, Clock, Star, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"

// Mock data
const categories = [
  { id: "1", name: "Restaurantes", icon: "🍕", count: 150 },
  { id: "2", name: "Supermercados", icon: "🛒", count: 45 },
  { id: "3", name: "Farmacias", icon: "💊", count: 30 },
  { id: "4", name: "Bebidas", icon: "🥤", count: 25 },
  { id: "5", name: "Postres", icon: "🍰", count: 60 },
  { id: "6", name: "Comida Rápida", icon: "🍔", count: 80 },
]

const featuredStores = [
  {
    id: "1",
    name: "Pizza Palace",
    category: "Restaurantes",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: 2.5,
    image: "/placeholder.svg?height=200&width=300",
    tags: ["Pizza", "Italiana"],
    distance: 1.2,
  },
  {
    id: "2",
    name: "Fresh Market",
    category: "Supermercados",
    rating: 4.6,
    deliveryTime: "45-60 min",
    deliveryFee: 3.0,
    image: "/placeholder.svg?height=200&width=300",
    tags: ["Frutas", "Verduras", "Carnes"],
    distance: 0.8,
  },
  {
    id: "3",
    name: "Burger House",
    category: "Comida Rápida",
    rating: 4.7,
    deliveryTime: "20-30 min",
    deliveryFee: 2.0,
    image: "/placeholder.svg?height=200&width=300",
    tags: ["Hamburguesas", "Papas"],
    distance: 1.5,
  },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">DeliveryApp</h1>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Hola, {user.name}</span>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      Perfil
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">Registrarse</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">Tu comida favorita, entregada en minutos</h2>
            <p className="text-xl opacity-90">Descubre restaurantes, supermercados y más cerca de ti</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar restaurantes, productos o tiendas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg bg-white/95 backdrop-blur-sm border-0 focus:bg-white"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2" size="sm">
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold mb-6">Categorías</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/category/${category.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer store-card">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h4 className="font-medium text-sm mb-1">{category.name}</h4>
                    <p className="text-xs text-gray-500">{category.count} tiendas</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stores */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Tiendas destacadas</h3>
            <Link href="/stores">
              <Button variant="ghost" className="flex items-center gap-1">
                Ver todas <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStores.map((store) => (
              <Link key={store.id} href={`/store/${store.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow store-card">
                  <div className="relative">
                    <img
                      src={store.image || "/placeholder.svg"}
                      alt={store.name}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-white text-gray-800">{store.category}</Badge>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg">{store.name}</h4>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {store.rating}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {store.deliveryTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {store.distance} km
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {store.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-sm font-medium">Envío ${store.deliveryFee.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">DeliveryApp</h4>
              <p className="text-gray-300">La mejor aplicación de delivery para satisfacer todos tus antojos.</p>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Empresa</h5>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="/about" className="hover:text-white">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white">
                    Carreras
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Soporte</h5>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Centro de ayuda
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Para negocios</h5>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href="/business" className="hover:text-white">
                    Registra tu negocio
                  </Link>
                </li>
                <li>
                  <Link href="/delivery" className="hover:text-white">
                    Sé repartidor
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 DeliveryApp. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
