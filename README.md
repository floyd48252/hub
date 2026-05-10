# Industrial & Domestic Cleaning Solutions - Backend Setup

## Overview
This backend system provides complete customer account management, invoice generation, printing, and service request tracking for the cleaning services business.

## Features
- ✅ Customer registration and login
- ✅ Customer account management
- ✅ Invoice generation and management
- ✅ Invoice viewing and printing
- ✅ Service request tracking
- ✅ Payment tracking
- ✅ Admin dashboard
- ✅ JWT authentication
- ✅ SQLite database

## Project Structure
```
.
├── server.js                          # Main backend server
├── package.json                       # Dependencies
├── .env.example                       # Environment variables template
├── public/
│   ├── login.html                    # Customer login page
│   ├── register.html                 # Customer registration page
│   ├── customer-dashboard.html       # Customer portal
│   └── admin-dashboard.html          # Admin portal
├── cleaning_service.db               # SQLite database (created on first run)
└── README.md                          # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup Steps

1. **Navigate to project directory**
   ```bash
   cd "path/to/industrial and domestic cleaning solutions"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Edit .env file** (optional - defaults work for development)
   ```
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main Website: `http://localhost:5000/`
   - Customer Login: `http://localhost:5000/login.html`
   - Customer Registration: `http://localhost:5000/register.html`
   - Customer Dashboard: `http://localhost:5000/customer-dashboard.html`
   - Admin Dashboard: `http://localhost:5000/admin-dashboard.html`

## Database Schema

### Customers Table
- `id` - Unique identifier
- `email` - Unique email address (login)
- `password` - Hashed password
- `company_name` - Business name
- `first_name`, `last_name` - Contact info
- `phone`, `address`, `city`, `state`, `zip` - Address information
- `created_at`, `updated_at` - Timestamps

### Invoices Table
- `id` - Unique identifier
- `customer_id` - Reference to customer
- `invoice_number` - Unique invoice number
- `description` - Service description
- `amount` - Total invoice amount
- `status` - pending, paid, or overdue
- `due_date` - Payment due date
- `issue_date` - When invoice was created

### Invoice Items Table (for itemized invoices)
- `id` - Unique identifier
- `invoice_id` - Reference to invoice
- `description` - Item description
- `quantity` - Quantity of service/product
- `unit_price` - Price per unit
- `total` - Total for this line item

### Service Requests Table
- `id` - Unique identifier
- `customer_id` - Reference to customer
- `service_type` - Type of service requested
- `description` - Service details
- `status` - pending, scheduled, completed, cancelled
- `requested_date` - When customer wants service
- `completed_date` - When service was completed

### Payments Table
- `id` - Unique identifier
- `invoice_id` - Reference to invoice
- `amount` - Payment amount
- `payment_method` - credit_card, bank_transfer, cash, check
- `payment_date` - When payment was made
- `transaction_id` - Payment processor transaction ID

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new customer account
- `POST /api/auth/login` - Login to account

### Customer Profile
- `GET /api/customer/profile` - Get current customer profile
- `PUT /api/customer/profile` - Update customer profile

### Invoices (Customer)
- `GET /api/invoices` - Get all invoices for customer
- `GET /api/invoices/:invoiceId` - Get invoice details
- `PUT /api/invoices/:invoiceId/status` - Update invoice status

### Service Requests
- `GET /api/service-history` - Get service history
- `POST /api/service-request` - Request new service

### Payments
- `POST /api/payments` - Record payment
- `GET /api/payments/:invoiceId` - Get payments for invoice

### Admin Endpoints
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/customer/:customerId/invoices` - Get customer invoices
- `GET /api/admin/dashboard` - Get dashboard statistics
- `POST /api/invoices` - Create invoice (admin)

## Demo Credentials

To test the system:
- Email: `demo@example.com`
- Password: `demo123`

(These will be created when you first create an account via registration)

## Features Guide

### Customer Portal
1. **Dashboard** - View summary of all invoices and account status
2. **Invoices** - View all invoices, amounts, and payment status
3. **Service History** - Track all past service requests
4. **Request Service** - Submit new service requests with preferred dates
5. **My Profile** - Update contact information and address

### Invoice Management
- View detailed invoices with itemized services
- See payment status at a glance
- Print invoices for records
- Download invoices as PDF (feature can be added with jsPDF library)

### Admin Dashboard
- View all customers and their details
- Create invoices for customers
- Track total revenue (paid vs pending)
- Monitor service requests

## Security Notes

⚠️ **Important for Production:**
1. Change JWT_SECRET in .env file to a strong random string
2. Use HTTPS instead of HTTP
3. Add password reset functionality
4. Implement role-based access control (RBAC)
5. Add input validation and sanitization
6. Implement rate limiting
7. Use environment variables for sensitive data
8. Add admin authentication (currently open)
9. Consider using bcryptjs with higher salt rounds
10. Add CSRF protection

## Extending the System

### Add Payment Processing
To integrate Stripe or PayPal:
```javascript
const stripe = require('stripe')('stripe-key');

app.post('/api/payments/charge', async (req, res) => {
    const charge = await stripe.charges.create({
        amount: req.body.amount * 100,
        currency: 'usd',
        source: req.body.token
    });
    // Record payment in database
});
```

### Add Email Notifications
```bash
npm install nodemailer
```

### Generate PDF Invoices
```bash
npm install pdfkit
```

### Add File Attachments
```bash
npm install multer
```

## Troubleshooting

**Server won't start:**
- Check if port 5000 is already in use
- Verify Node.js is installed: `node --version`

**Database errors:**
- Delete `cleaning_service.db` to reset the database
- Run the server again to initialize fresh database

**Login not working:**
- Make sure server is running
- Check browser console for errors (F12)
- Verify email and password are correct

**CORS errors:**
- The backend has CORS enabled for all origins by default
- For production, specify allowed origins in `cors()` call

## Support

For issues or questions, contact the development team or check the server logs for detailed error messages.

## License

All rights reserved - Industrial & Domestic Cleaning Solutions
