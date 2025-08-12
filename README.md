# AI-Driven Advertising Platform

A comprehensive mobile application for businesses and individuals to advertise their products and services with AI-powered optimization, CRM system, and advanced analytics.

## 🚀 Features

### Core Platform
- **AI-Driven Ad Optimization**: Fully automated advertising campaigns with machine learning
- **High-Traffic Platform**: Reach your target audience effectively
- **Mobile-First Design**: Native mobile app experience

### CRM System
- **Client Management**: Comprehensive customer relationship management
- **Communication Tracking**: Log and track all client interactions
- **Engagement Scoring**: AI-powered client engagement analytics
- **Follow-up Management**: Never miss important client touchpoints

### Analytics Dashboard
- **Real-time Metrics**: Track revenue, impressions, clicks, and conversions
- **Performance Charts**: Visual representation of campaign performance
- **AI Insights**: Automated recommendations for campaign optimization
- **Custom Reports**: Detailed analytics for informed decision-making

### Subscription Model
- **Free Trial**: 7-day free trial with full feature access
- **Affordable Pricing**: $30/month subscription
- **PayPal Integration**: Secure payment processing
- **Flexible Billing**: Easy subscription management

## 🛠 Technology Stack

### Frontend (Mobile App)
- **React Native**: Cross-platform mobile development
- **Expo**: Development and build platform
- **TypeScript**: Type-safe development
- **Redux Toolkit**: State management
- **React Native Paper**: Material Design components
- **React Navigation**: Navigation system

### Backend (API)
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **MongoDB**: Database
- **JWT**: Authentication
- **PayPal SDK**: Payment processing
- **Mongoose**: MongoDB object modeling

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Git**: Version control

## 📱 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- MongoDB (local or cloud)

### Frontend Setup
```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# - MongoDB connection string
# - JWT secret
# - PayPal credentials

# Start the server
npm run dev
```

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ai-ad-platform

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server
PORT=3000
NODE_ENV=development

# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🏗 Project Structure

```
ai-ad-platform/
├── src/                          # Frontend source code
│   ├── components/               # Reusable components
│   ├── screens/                  # Screen components
│   │   ├── Auth/                # Authentication screens
│   │   ├── Dashboard/           # Dashboard screens
│   │   ├── CRM/                 # CRM screens
│   │   ├── Analytics/           # Analytics screens
│   │   ├── Ads/                 # Ad management screens
│   │   └── Profile/             # Profile screens
│   ├── navigation/              # Navigation configuration
│   ├── services/                # API services
│   ├── store/                   # Redux store and slices
│   ├── theme/                   # Theme configuration
│   └── utils/                   # Utility functions
├── backend/                     # Backend source code
│   ├── models/                  # Database models
│   ├── routes/                  # API routes
│   ├── middleware/              # Custom middleware
│   ├── services/                # Business logic services
│   └── server.js               # Server entry point
├── assets/                      # Static assets
└── docs/                       # Documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### CRM
- `GET /api/crm/clients` - Get all clients
- `POST /api/crm/clients` - Create new client
- `GET /api/crm/clients/:id` - Get specific client
- `PUT /api/crm/clients/:id` - Update client
- `DELETE /api/crm/clients/:id` - Delete client
- `POST /api/crm/clients/:id/communications` - Add communication
- `POST /api/crm/clients/:id/notes` - Add note

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/reports` - Get detailed reports

### Ads (Coming Soon)
- `GET /api/ads` - Get all ads
- `POST /api/ads` - Create new ad
- `PUT /api/ads/:id` - Update ad
- `DELETE /api/ads/:id` - Delete ad

## 🎯 Development Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and architecture
- [x] Authentication system
- [x] Basic mobile app structure
- [x] Backend API foundation

### Phase 2: CRM System ✅
- [x] Client management
- [x] Communication tracking
- [x] Notes and follow-ups
- [x] CRM dashboard

### Phase 3: Analytics Dashboard ✅
- [x] Performance metrics
- [x] Visual charts and graphs
- [x] AI insights placeholder
- [x] Real-time data display

### Phase 4: Advertising Platform (In Progress)
- [ ] Ad creation and management
- [ ] Campaign optimization
- [ ] AI-driven recommendations
- [ ] Performance tracking

### Phase 5: Payment Integration (Planned)
- [ ] PayPal subscription setup
- [ ] Free trial management
- [ ] Billing and invoicing
- [ ] Subscription analytics

### Phase 6: AI Features (Planned)
- [ ] Machine learning models
- [ ] Automated ad optimization
- [ ] Predictive analytics
- [ ] Smart recommendations

### Phase 7: Production Ready (Planned)
- [ ] Google Play Store optimization
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Comprehensive testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: boyboyjim@gmail.com
- Create an issue in this repository

## 🙏 Acknowledgments

- React Native community for excellent documentation
- Expo team for the amazing development platform
- MongoDB for the flexible database solution
- PayPal for secure payment processing

---

**Built with ❤️ for businesses and advertisers worldwide**

