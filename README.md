# buy-sell-marketplace - Classified Ads Platform (jiji.ng clone)
All-in-One Marketplace where users can buy or list different products for sale. Includes features like Notifications, Chat, User follow, Rate user and Add favourites.

## Features
- **Crypto Payment Integration**: Secure payments using Helio SDK for cryptocurrency transactions
- **Order Management**: Complete order lifecycle from payment to delivery confirmation
- **Commission System**: 10% platform commission on all transactions
- **Real-time Updates**: Socket.io integration for live order status updates
- **Admin Dashboard**: Comprehensive admin panel for order management and payouts
- **User Dashboards**: Separate buyer and seller interfaces for order tracking

## Order Flow
1. **Buyer initiates payment** → Order created in AWAITING_PAYMENT status
2. **Payment successful** → Status updates to PENDING
3. **Seller marks as delivering** → Status changes to DELIVERING with tracking info
4. **Buyer confirms delivery** → Status updates to COMPLETED
5. **Admin settles payout** → Status changes to PENDING_PAY then PAID (90% to seller, 10% commission)

## User Dashboard
![My Image](https://raw.githubusercontent.com/babadinho/buy-sell-marketplace/main/client/public/user-dashboard.gif)

## Admin Dashboard
![My Image](https://raw.githubusercontent.com/babadinho/buy-sell-marketplace/main/client/public/admin-dashboard.gif)

## Some Features
![My Image](https://raw.githubusercontent.com/babadinho/buy-sell-marketplace/main/client/public/site-1.gif)


![My Image](https://raw.githubusercontent.com/babadinho/buy-sell-marketplace/main/client/public/site-2.gif)


![My Image](https://raw.githubusercontent.com/babadinho/buy-sell-marketplace/main/client/public/site-3.gif)


![My Image](https://raw.githubusercontent.com/babadinho/buy-sell-marketplace/main/client/public/site-4.gif)


![My Image](https://raw.githubusercontent.com/babadinho/buy-sell-marketplace/main/client/public/site-5.gif)

## Installation & Setup

### Prerequisites
- Node.js (v12.18.4 or higher)
- MongoDB database
- Helio account for crypto payments

### Backend Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with required environment variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   HELIO_PUBLIC_KEY=your_helio_public_key
   HELIO_SECRET_KEY=your_helio_secret_key
   HELIO_WEBHOOK_SECRET=your_helio_webhook_secret
   ADMIN_WALLET_ADDRESS=your_admin_wallet_address
   ```
4. Start the server: `npm start`

### Frontend Setup
1. Navigate to client directory: `cd client`
2. Install dependencies: `npm install`
3. Create `.env` file: `REACT_APP_API=http://localhost:8000/api`
4. Start the client: `npm start`

### Deployment
1. Build the client: `cd client && npm run build`
2. Set environment variables on your hosting platform
3. Deploy the server (Heroku, Railway, etc.)
4. Ensure webhook URL is configured in Helio dashboard for payment callbacks

## API Endpoints

### Payment
- `POST /api/payment/create` - Create payment link
- `POST /api/payment/webhook` - Handle payment webhooks
- `PUT /api/payment/status` - Update order status

### Orders
- `GET /api/orders/buyer/:buyerId` - Get buyer's orders
- `GET /api/orders/seller/:sellerId` - Get seller's orders
- `GET /api/admin/orders` - Get all orders (admin)

### Admin
- `GET /api/admin/pending-pay-orders` - Get orders pending payout
- `POST /api/admin/pay-seller` - Process seller payout

## Testing
Use the provided Postman collection for API testing. Ensure all environment variables are set before testing payment flows.
