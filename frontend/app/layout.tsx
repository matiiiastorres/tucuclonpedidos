import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { CartProvider } from "@/context/CartContext"
import { LocationProvider } from "@/context/LocationContext"
import { OrderProvider } from "@/context/OrderContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DeliveryApp - Tu comida favorita a domicilio",
  description: "Aplicación de delivery para pedir comida, supermercado y más",
  keywords: "delivery, comida, restaurantes, supermercado, farmacia",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <LocationProvider>
              <CartProvider>
                <OrderProvider>
                  {children}
                  <Toaster />
                </OrderProvider>
              </CartProvider>
            </LocationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
