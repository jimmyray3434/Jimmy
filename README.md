# Passive Income AI Platform

An automated passive income platform that generates its own traffic using AI bots and allows users to earn revenue with minimal intervention.

## Features

### Payment System
- PayPal integration for automated withdrawals
- Transaction tracking and management
- Revenue analytics and reporting
- Automated withdrawal scheduling

### Traffic Generation
- AI-powered traffic campaigns
- Multi-channel traffic distribution
- Campaign performance analytics
- Social media account integration

### CRM System
- Lead management and nurturing
- Contact tracking
- Automated lead qualification
- Email templates and automation

### Content Management
- AI-generated content creation
- Content performance tracking
- Traffic generation for content
- Publishing and archiving workflows

## Technical Stack

### Backend
- Node.js with Express
- MongoDB for database
- JWT authentication
- RESTful API architecture

### Frontend
- React Native for cross-platform mobile app
- Redux for state management
- React Native Paper for UI components
- Chart.js for data visualization

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- PayPal Developer Account (for payment integration)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/passive-income-ai.git
cd passive-income-ai
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../
npm install
```

3. Set up environment variables
Create a `.env` file in the backend directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

4. Run the application
```bash
# Run backend server
cd backend
npm run dev

# Run frontend application
cd ../
npm start
```

## Project Structure

```
passive-income-ai/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── payment/
│   │   ├── traffic/
│   │   └── crm/
│   ├── screens/
│   │   ├── auth/
│   │   ├── payment/
│   │   ├── traffic/
│   │   └── crm/
│   ├── store/
│   │   └── slices/
│   ├── services/
│   └── utils/
└── App.js
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Payment
- `GET /api/payment/transactions` - Get user's transactions
- `GET /api/payment/revenue` - Get revenue summary
- `POST /api/payment/withdraw` - Process withdrawal
- `GET /api/payment/accounts/:provider` - Get payment account
- `POST /api/payment/connect/:provider` - Connect payment account

### Traffic
- `GET /api/traffic/campaigns` - Get user's campaigns
- `POST /api/traffic/campaigns` - Create new campaign
- `GET /api/traffic/stats` - Get traffic statistics
- `POST /api/traffic/generate/:contentId` - Generate traffic

### CRM
- `GET /api/crm/leads` - Get user's leads
- `POST /api/crm/leads` - Create new lead
- `GET /api/crm/contacts` - Get user's contacts
- `POST /api/crm/leads/:id/convert` - Convert lead to contact
- `GET /api/crm/automations` - Get user's automations

### Content
- `GET /api/content` - Get user's content
- `POST /api/content` - Create new content
- `POST /api/content/generate` - Generate content using AI
- `POST /api/content/:id/publish` - Publish content
- `POST /api/content/:id/generate-traffic` - Generate traffic for content

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- PayPal API for payment processing
- MongoDB for database services
- React Native Paper for UI components
- Chart.js for data visualization

