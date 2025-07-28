# DeliveryApp

## Frontend

Frontend de la aplicación de delivery construido con Next.js 14, TypeScript y Tailwind CSS.

## 🚀 Características

- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **Axios** para llamadas a la API
- **Socket.IO** para tiempo real
- **Context API** para estado global
- **Responsive Design** mobile-first

## 📋 Requisitos

- Node.js >= 16.0.0
- npm o yarn
- Backend API ejecutándose en puerto 5000

## 🛠 Instalación

1. **Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

2. **Configurar variables de entorno**
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Editar `.env.local`:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
\`\`\`

3. **Iniciar el servidor de desarrollo**
\`\`\`bash
npm run dev
\`\`\`

4. **Abrir en el navegador**
\`\`\`
http://localhost:3000
\`\`\`

## 📱 Funcionalidades

### **Para Clientes**
- Registro e inicio de sesión
- Búsqueda de tiendas por ubicación
- Navegación por categorías
- Carrito de compras
- Checkout y pagos
- Seguimiento de pedidos en tiempo real
- Historial de pedidos
- Calificaciones y reseñas

### **Para Dueños de Tienda**
- Panel de administración de tienda
- Gestión de productos
- Gestión de pedidos
- Estadísticas de ventas

### **Para Administradores**
- Panel de administración completo
- Gestión de usuarios y tiendas
- Estadísticas generales

## 🏗 Estructura del Proyecto

\`\`\`
├── app/                 # App Router pages
├── components/          # Componentes reutilizables
├── context/            # Context providers
├── hooks/              # Custom hooks
├── lib/                # Utilidades y configuración
├── public/             # Archivos estáticos
└── types/              # Definiciones de tipos
\`\`\`

## 🔧 Scripts Disponibles

\`\`\`bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run start        # Iniciar en producción
npm run lint         # Linter
\`\`\`

## 🌐 Despliegue

### Vercel (Recomendado)
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Netlify
1. Build command: `npm run build`
2. Publish directory: `out`
3. Configurar variables de entorno

## Backend

Backend completo para aplicación de delivery estilo Uber Eats/Rappi construido con Node.js, Express y MongoDB.

## 🚀 Características

- **Autenticación JWT** con roles (Cliente, Dueño de tienda, Admin, Repartidor)
- **API RESTful** completa
- **WebSockets** para actualizaciones en tiempo real
- **Validación** robusta con express-validator
- **Seguridad** con helmet, rate limiting y CORS
- **Base de datos** MongoDB con Mongoose
- **Subida de archivos** con Multer

## 📋 Requisitos

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm o yarn

## 🛠 Instalación

1. **Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

2. **Configurar variables de entorno**
\`\`\`bash
cp .env.example .env
\`\`\`

Editar `.env` con tus configuraciones:
\`\`\`env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/delivery-app
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
\`\`\`

3. **Iniciar MongoDB**
\`\`\`bash
# Con Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# O instalar localmente
mongod
\`\`\`

4. **Poblar la base de datos**
\`\`\`bash
npm run seed
\`\`\`

5. **Iniciar el servidor**
\`\`\`bash
# Desarrollo
npm run dev

# Producción
npm start
\`\`\`

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/logout` - Cerrar sesión

### Tiendas
- `GET /api/stores` - Listar tiendas
- `GET /api/stores/featured/list` - Tiendas destacadas

### Usuarios
- `GET /api/users/profile` - Perfil del usuario

### Pedidos
- `GET /api/orders` - Listar pedidos del usuario

### Categorías
- `GET /api/categories` - Listar categorías

### Ubicación
- `POST /api/location/geocode` - Geocodificar dirección

### Administración
- `GET /api/admin/dashboard` - Dashboard de admin (Solo Admin)

### Subida de archivos
- `POST /api/upload/single` - Subir archivo único

### Health Check
- `GET /api/health` - Estado del servidor

## 🗄 Modelos de Datos

### Usuario
\`\`\`javascript
{
  name: String,
  email: String,
  password: String,
  role: ['client', 'store_owner', 'admin', 'delivery_driver'],
  addresses: [AddressSchema],
  favoriteStores: [ObjectId],
  loyaltyPoints: Number
}
\`\`\`

## 🔐 Autenticación

El sistema usa JWT tokens para autenticación. Incluir el token en el header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

### Roles disponibles:
- **client**: Puede hacer pedidos
- **store_owner**: Puede gestionar su tienda y productos
- **admin**: Acceso completo al sistema
- **delivery_driver**: Puede actualizar estados de entrega

## 🧪 Datos de Prueba

Después de ejecutar `npm run seed`:

\`\`\`
Admin: admin@delivery.com / password123
Cliente: client@delivery.com / password123
Tienda: store@delivery.com / password123
\`\`\`

## 📡 WebSockets

Eventos en tiempo real:
- `new-order`: Nueva orden para la tienda
- `order-status-updated`: Actualización de estado
- `order-cancelled`: Pedido cancelado

\`\`\`javascript
// Cliente se une a sala de pedido
socket.emit('join-order', orderId);

// Tienda se une a su sala
socket.emit('join-store', storeId);
\`\`\`

## 🚀 Despliegue

### Railway
\`\`\`bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway init
railway up
\`\`\`

### Render
1. Conectar repositorio en Render
2. Configurar variables de entorno
3. Deploy automático

### Variables de entorno para producción:
\`\`\`env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production-secret
FRONTEND_URL=https://your-frontend.vercel.app
\`\`\`

## 📊 Monitoreo

### Health Check
\`\`\`bash
GET /api/health
\`\`\`

Respuesta:
\`\`\`json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
\`\`\`

## 🔧 Desarrollo

### Estructura del proyecto
\`\`\`
├── models/          # Modelos de Mongoose
├── routes/          # Rutas de la API
├── middleware/      # Middleware personalizado
├── scripts/         # Scripts de utilidad
├── uploads/         # Archivos subidos
└── server.js        # Punto de entrada
\`\`\`

### Comandos útiles
\`\`\`bash
npm run dev          # Desarrollo con nodemon
npm run seed         # Poblar base de datos
npm test             # Ejecutar tests
\`\`\`

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
