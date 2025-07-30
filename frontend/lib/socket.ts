import { io, type Socket } from "socket.io-client"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"

class SocketService {
  private socket: Socket | null = null

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        autoConnect: true,
      })

      this.socket.on("connect", () => {
        console.log("Connected to server")
      })

      this.socket.on("disconnect", () => {
        console.log("Disconnected from server")
      })

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error)
      })
    }
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  joinOrderRoom(orderId: string) {
    if (this.socket) {
      this.socket.emit("join-order", orderId)
    }
  }

  onOrderStatusUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("order-status-updated", callback)
    }
  }

  offOrderStatusUpdate() {
    if (this.socket) {
      this.socket.off("order-status-updated")
    }
  }
}

export const socketService = new SocketService()
