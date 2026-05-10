const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;

// Simple in-memory user storage for demo
const users = [];
const adminCredentials = { email: 'admin@cleaning.com', password: 'Admin123!' };

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Authentication middleware
const checkAuth = (req, res, next) => {
    // Allow access to login/register pages and static assets
    if (req.path === '/index.html' || req.path === '/login.html' || req.path === '/register.html' || req.path === '/admin-login.html' || 
        req.path === '/styles.css' || req.path === '/auth.js' || req.path === '/logo.jpeg' || 
        req.path === '/manifest.json' || req.path.startsWith('/images/') || req.path.startsWith('/icons/')) {
        return next();
    }
    
    // Check for authentication token in localStorage (simulated via headers)
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'No authentication token' });
    }
    
    // Simple token validation (in real app, this would be JWT verification)
    const user = users.find(u => u.token === token);
    if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
};

// Protected routes middleware
const requireAuth = (req, res, next) => {
    checkAuth(req, res, () => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        next();
    });
};

// API endpoint for user authentication
app.post('/api/auth', (req, res) => {
    const { email, password, action } = req.body;
    
    if (action === 'login') {
        // Check admin credentials
        if (email === 'admin@cleaning.com' && password === 'Admin123!') {
            const token = 'admin-token-' + Date.now();
            const adminUser = { email, type: 'admin', name: 'Administrator' };
            users.push(adminUser);
            return res.json({
                success: true,
                user: adminUser,
                token
            });
        }
        
        // Check customer credentials (simplified for demo)
        const demoCustomers = [
            { email: 'john.doe@email.com', password: 'customer123', name: 'John Doe', company: 'Doe Enterprises' },
            { email: 'jane.smith@email.com', password: 'customer123', name: 'Jane Smith', company: 'Smith Consulting' },
            { email: 'mike.wilson@email.com', password: 'customer123', name: 'Mike Wilson', company: 'Wilson Services' }
        ];
        
        const customer = demoCustomers.find(c => c.email === email && c.password === password);
        if (customer) {
            const token = 'customer-token-' + Date.now();
            const customerUser = { 
                ...customer, 
                type: 'customer',
                invoices: [],
                service_requests: []
            };
            users.push(customerUser);
            return res.json({
                success: true,
                user: customerUser,
                token
            });
        }
        
        return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    if (action === 'register') {
        const { first_name, last_name, phone, company_name } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }
        
        // For demo, just return success (no actual storage)
        return res.json({
            success: true,
            user: {
                email,
                first_name: first_name || 'Customer',
                last_name: last_name || '',
                phone: phone || 'N/A',
                company_name: company_name || 'N/A',
                type: 'customer',
                invoices: [],
                service_requests: []
            },
            token: 'customer-token-' + Date.now()
        });
    }
    
    return res.status(400).json({ success: false, error: 'Invalid action' });
});

// API endpoint for service requests
app.post('/api/service-requests', requireAuth, (req, res) => {
    const { service_type, description, requested_date } = req.body;
    
    if (!service_type || !description) {
        return res.status(400).json({ success: false, error: 'Service type and description required' });
    }
    
    const request = {
        id: Date.now(),
        customer_email: req.user.email,
        service_type,
        description,
        requested_date: requested_date || 'Flexible',
        status: 'Pending',
        created_at: new Date().toISOString()
    };
    
    // Store in user's service requests (in real app, this would be database)
    if (!req.user.service_requests) {
        req.user.service_requests = [];
    }
    req.user.service_requests.push(request);
    
    res.json({ success: true, request });
});

// API endpoint for invoices
app.post('/api/invoices', requireAuth, (req, res) => {
    const { customer_email, invoice_number, description, amount, due_date } = req.body;
    
    if (!customer_email || !invoice_number || !description || !amount || !due_date) {
        return res.status(400).json({ success: false, error: 'All invoice fields required' });
    }
    
    const invoice = {
        id: Date.now(),
        customer_email,
        invoice_number,
        description,
        amount: parseFloat(amount).toFixed(2),
        due_date,
        status: 'Pending',
        created_at: new Date().toISOString()
    };
    
    // Store in user's invoices (in real app, this would be database)
    if (!req.user.invoices) {
        req.user.invoices = [];
    }
    req.user.invoices.push(invoice);
    
    res.json({ success: true, invoice });
});

// API endpoint to get user data
app.get('/api/user', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// API endpoint to get all users (admin only)
app.get('/api/users', requireAuth, (req, res) => {
    if (req.user.type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({
        success: true,
        users: users.filter(u => u.type === 'customer')
    });
});

// Serve main page with auth check
app.get('/index.html', checkAuth, (req, res) => {
    if (!req.user) {
        // Redirect to login page if not authenticated
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve login pages
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Logout endpoint
app.post('/api/logout', requireAuth, (req, res) => {
    // Remove user from users array
    const index = users.findIndex(u => u.email === req.user.email);
    if (index !== -1) {
        users.splice(index, 1);
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
});

// Start server
app.listen(PORT, () => {
    console.log(`New system server running on http://localhost:${PORT}`);
    console.log('Access the system at: http://localhost:8080');
    console.log('Demo admin credentials: admin@cleaning.com / Admin123!');
    console.log('Demo customer credentials: john.doe@email.com / customer123');
    console.log('Authentication required for protected pages');
});
