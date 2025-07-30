# 🚀 DeliveryApp - Complete Delivery Platform

A comprehensive delivery application similar to Uber Eats/Rappi built with Next.js 14, Node.js, Express, MongoDB, and TypeScript. Features include real-time order tracking, multi-role authentication, shopping cart, reviews, coupons, and admin dashboards.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🛍️ Customer Features
- **User Authentication**: Register, login, profile management
- **Store Discovery**: Browse stores by category, location, ratings
- **Product Catalog**: Search and filter products with advanced filters
- **Shopping Cart**: Persistent cart with customizations and add-ons
- **Checkout**: Multiple payment methods, delivery scheduling
- **Order Tracking**: Real-time order status updates with map integration
- **Reviews & Ratings**: Rate orders and stores, view reviews
- **Favorites**: Save favorite stores and products
- **Coupons & Loyalty**: Apply discount coupons, earn loyalty points
- **Address Management**: Multiple delivery addresses
- **Order History**: Complete order history with reorder functionality

### 🏪 Store Owner Features
- **Store Management**: Complete store profile and settings
- **Product Management**: Add, edit, manage product catalog
- **Order Management**: Accept, track, and fulfill orders
- **Analytics Dashboard**: Sales metrics, performance insights
- **Reviews Management**: Respond to customer reviews
- **Coupon Creation**: Create and manage store-specific coupons
- **Business Hours**: Set operating hours and availability
- **Delivery Zone**: Configure delivery areas and fees

### 👨‍💼 Admin Features
- **User Management**: Manage all users, roles, and permissions
- **Store Approval**: Review and approve new store registrations
- **Order Oversight**: Monitor all orders across the platform
- **Analytics**: Platform-wide statistics and insights
- **Content Management**: Manage categories, featured content
- **System Settings**: Configure platform settings and features

### 🚛 Additional Features
- **Real-time Updates**: WebSocket integration for live order tracking
- **Mobile Responsive**: Optimized for all devices
- **Dark Mode**: Theme switching capability
- **PWA Support**: Progressive Web App features
- **Push Notifications**: Real-time notifications
- **Multi-language**: Internationalization support
- **SEO Optimized**: Meta tags, structured data
- **Performance**: Optimized images, lazy loading, caching

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-time**: Socket.IO
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Payment**: Stripe, PayPal
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

### DevOps & Deployment
- **Frontend Deployment**: Netlify, Vercel
- **Backend Deployment**: Railway, Render, Heroku
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Monitoring**: Built-in health checks
- **Environment**: Docker support

## 📁 Project Structure

```
delivery-app/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility libraries
│   ├── stores/              # Zustand state stores
│   ├── services/            # API services
│   ├── types/               # TypeScript type definitions
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
│
├── backend/                 # Node.js backend application
│   ├── models/              # Mongoose database models
│   ├── routes/              # Express API routes
│   ├── middleware/          # Custom middleware
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration files
│   ├── scripts/             # Database seeds and scripts
│   ├── uploads/             # File upload directory
│   ├── server.js            # Application entry point
│   └── package.json         # Backend dependencies
│
├── docs/                    # Documentation
├── .gitignore               # Git ignore rules
└── README.md                # Project documentation
```

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16.0.0 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd delivery-app
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. **Create Environment File**
```bash
cd backend
cp .env.example .env
```

2. **Update Environment Variables**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/delivery-app

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Integration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Configuration

1. **Create Environment File**
```bash
cd frontend
cp .env.local.example .env.local
```

2. **Update Environment Variables**
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Payment Integration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start MongoDB** (if running locally)
```bash
mongod
```

2. **Start Backend Server**
```bash
cd backend
npm run dev
```
Backend will be available at `http://localhost:5000`

3. **Start Frontend Application**
```bash
cd frontend
npm run dev
```
Frontend will be available at `http://localhost:3000`

### Production Mode

1. **Build Frontend**
```bash
cd frontend
npm run build
npm start
```

2. **Start Backend**
```bash
cd backend
npm start
```

### Using Docker (Optional)

1. **Backend with Docker**
```bash
cd backend
docker build -t delivery-backend .
docker run -p 5000:5000 delivery-backend
```

2. **Frontend with Docker**
```bash
cd frontend
docker build -t delivery-frontend .
docker run -p 3000:3000 delivery-frontend
```

## 🗄️ Database Setup

### Seed Database with Sample Data
```bash
cd backend
npm run seed
```

This will create:
- Sample categories (Restaurants, Grocery, Pharmacy, etc.)
- Demo stores with products
- Test users with different roles
- Sample orders and reviews

### Default Test Accounts
After seeding, you can use these accounts:

**Admin Account:**
- Email: `admin@deliveryapp.com`
- Password: `password123`

**Store Owner Account:**
- Email: `store@deliveryapp.com`
- Password: `password123`

**Customer Account:**
- Email: `customer@deliveryapp.com`
- Password: `password123`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Store Endpoints
- `GET /api/stores` - Get all stores
- `GET /api/stores/:id` - Get store details
- `GET /api/stores/featured/list` - Get featured stores
- `GET /api/stores/:id/products` - Get store products

### Cart & Orders
- `GET /api/cart/:storeId` - Get user cart
- `POST /api/cart/:storeId/items` - Add item to cart
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders

### Reviews & Ratings
- `POST /api/reviews` - Create review
- `GET /api/reviews/store/:storeId` - Get store reviews

### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Manage users
- `GET /api/admin/stores` - Manage stores

For complete API documentation, visit: `http://localhost:5000/api/health`

## 🚀 Deployment

### Frontend Deployment (Netlify)

1. **Build for Production**
```bash
cd frontend
npm run build
npm run export
```

2. **Deploy to Netlify**
- Connect your repository to Netlify
- Set build command: `npm run build && npm run export`
- Set publish directory: `out`
- Configure environment variables

### Backend Deployment (Railway)

1. **Prepare for Deployment**
```bash
cd backend
```

2. **Deploy to Railway**
- Install Railway CLI: `npm install -g @railway/cli`
- Login: `railway login`
- Initialize: `railway init`
- Deploy: `railway up`
- Set environment variables in Railway dashboard

### Environment Variables for Production

**Backend (.env):**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/delivery-app
JWT_SECRET=production-secret-key
FRONTEND_URL=https://your-frontend-domain.netlify.app
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.railway.app
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

## 🔧 Development

### Code Style
- ESLint and Prettier configured
- Run `npm run lint` to check code style
- Run `npm run lint:fix` to auto-fix issues

### Git Hooks
- Pre-commit hooks run linting and tests
- Conventional commit messages enforced

### Environment Setup
1. Install recommended VS Code extensions
2. Configure ESLint and Prettier
3. Set up debugging configurations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Read the documentation thoroughly
3. Create a new issue with detailed information

## 🎯 Roadmap

- [ ] Mobile apps (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Voice ordering
- [ ] AI-powered recommendations
- [ ] Delivery driver mobile app
- [ ] Integration with third-party delivery services

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by leading delivery platforms
- Community contributions welcome

---

**Happy Coding! 🚀**
