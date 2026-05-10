const DEFAULT_ADMIN_CREDENTIALS = {
    email: 'admin@cleaning.com',
    password: 'Admin123!'
};

const STORAGE_KEYS = {
    users: 'cleaning_users',
    currentUser: 'cleaning_current_user',
    adminCredentials: 'cleaning_admin_credentials',
    adminReturn: 'cleaning_admin_return_session',
    adminRecovery: 'cleaning_admin_recovery_code'
};

function getUsers() {
    const data = localStorage.getItem(STORAGE_KEYS.users);
    return data ? JSON.parse(data) : [];
}

function setUsers(users) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getAdminCredentials() {
    const raw = localStorage.getItem(STORAGE_KEYS.adminCredentials);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.email === 'string' && typeof parsed.password === 'string') {
                return parsed;
            }
        } catch (_) {
            // fallthrough
        }
    }
    localStorage.setItem(STORAGE_KEYS.adminCredentials, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
    return { ...DEFAULT_ADMIN_CREDENTIALS };
}

function setAdminCredentials(credentials) {
    localStorage.setItem(STORAGE_KEYS.adminCredentials, JSON.stringify(credentials));
}

function generateRecoveryCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 16; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return `REC-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}`;
}

function getAdminRecoveryCode() {
    const raw = localStorage.getItem(STORAGE_KEYS.adminRecovery);
    if (raw && typeof raw === 'string' && raw.trim().length >= 8) return raw;
    const fresh = generateRecoveryCode();
    localStorage.setItem(STORAGE_KEYS.adminRecovery, fresh);
    return fresh;
}

function setAdminRecoveryCode(code) {
    localStorage.setItem(STORAGE_KEYS.adminRecovery, code);
}

function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
    return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
}

function getAdminReturnSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.adminReturn);
    return raw ? JSON.parse(raw) : null;
}

function setAdminReturnSession(session) {
    localStorage.setItem(STORAGE_KEYS.adminReturn, JSON.stringify(session));
}

function clearAdminReturnSession() {
    localStorage.removeItem(STORAGE_KEYS.adminReturn);
}

function showNotice(element, message, isError = true) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
    element.style.color = isError ? '#b91c1c' : '#064e3b';
    element.style.background = isError ? '#fee2e2' : '#d1fae5';
    element.style.border = '1px solid ' + (isError ? '#fecaca' : '#86efac');
}

function hideNotice(element) {
    if (!element) return;
    element.style.display = 'none';
    element.textContent = '';
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function registerCustomer(form) {
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const firstName = form.first_name.value.trim();
    const lastName = form.last_name.value.trim();
    const companyName = form.company_name.value.trim();
    const phone = form.phone.value.trim();
    const notice = document.getElementById('register-error');

    hideNotice(notice);

    if (!validateEmail(email)) {
        showNotice(notice, 'Please enter a valid email address.');
        return;
    }
    if (password.length < 6) {
        showNotice(notice, 'Password must be at least 6 characters long.');
        return;
    }

    try {
        // Try to register via backend API
        const response = await fetch('http://localhost:8080/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'register',
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                phone,
                company_name: companyName
            })
        });

        const result = await response.json();

        if (result.success) {
            // Store user data in localStorage for frontend compatibility
            const users = getUsers();
            users.push(result.user);
            setUsers(users);
            setCurrentUser(result.user);
            window.location.href = 'customer-dashboard.html';
        } else {
            showNotice(notice, result.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        // Fallback to localStorage if backend is not available
        const users = getUsers();
        const existing = users.find((user) => user.email === email);
        if (existing) {
            showNotice(notice, 'This email is already registered. Please log in instead.');
            return;
        }

        const newUser = {
            email,
            password,
            first_name: firstName || 'Customer',
            last_name: lastName || '',
            company_name: companyName || 'N/A',
            phone: phone || 'N/A',
            invoices: [],
            service_requests: []
        };

        users.push(newUser);
        setUsers(users);
        setCurrentUser({...newUser, type: 'customer' });
        window.location.href = 'customer-dashboard.html';
    }
}

async function loginCustomer(form) {
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const notice = document.getElementById('login-error');

    hideNotice(notice);

    if (!validateEmail(email)) {
        showNotice(notice, 'Please enter a valid email address.');
        return;
    }

    try {
        // Try to login via backend API
        const response = await fetch('http://localhost:8080/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email,
                password
            })
        });

        const result = await response.json();

        if (result.success) {
            // Store user data in localStorage for frontend compatibility
            const users = getUsers();
            users.push(result.user);
            setUsers(users);
            setCurrentUser(result.user);
            window.location.href = 'customer-dashboard.html';
        } else {
            showNotice(notice, result.error || 'Email or password is incorrect. Please try again.');
        }
    } catch (error) {
        // Fallback to localStorage if backend is not available
        const users = getUsers();
        const user = users.find((item) => item.email === email && item.password === password);
        if (!user) {
            showNotice(notice, 'Email or password is incorrect. Please try again.');
            return;
        }

        setCurrentUser({...user, type: 'customer' });
        window.location.href = 'customer-dashboard.html';
    }
}

async function loginAdmin(form) {
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const notice = document.getElementById('admin-error');

    hideNotice(notice);

    try {
        // Try to login via backend API
        const response = await fetch('http://localhost:8080/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email,
                password
            })
        });

        const result = await response.json();

        if (result.success) {
            // Store user data in localStorage for frontend compatibility
            const users = getUsers();
            users.push(result.user);
            setUsers(users);
            setCurrentUser(result.user);
            window.location.href = 'admin-dashboard.html';
        } else {
            showNotice(notice, result.error || 'Admin credentials are incorrect.');
        }
    } catch (error) {
        // Fallback to localStorage if backend is not available
        const admin = getAdminCredentials();
        if (email !== admin.email || password !== admin.password) {
            showNotice(notice, 'Admin credentials are incorrect.');
            return;
        }

        setCurrentUser({ email, type: 'admin' });
        window.location.href = 'admin-dashboard.html';
    }
}

// Functions for the index.html login modal
async function handleIndexLogin(email, password, role) {
    if (!validateEmail(email)) {
        return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
        // Try to login via backend API
        const response = await fetch('http://localhost:8080/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email,
                password
            })
        });

        const result = await response.json();

        if (result.success) {
            // Store user data in localStorage for frontend compatibility
            const users = getUsers();
            users.push(result.user);
            setUsers(users);
            setCurrentUser(result.user);
            return { success: true, user: result.user };
        } else {
            return { success: false, error: result.error || 'Login failed. Please try again.' };
        }
    } catch (error) {
        // Fallback to localStorage if backend is not available
        if (role === 'admin') {
            const admin = getAdminCredentials();
            if (email === admin.email && password === admin.password) {
                setCurrentUser({ email, type: 'admin' });
                return { success: true, user: { email, type: 'admin' } };
            } else {
                return { success: false, error: 'Admin credentials are incorrect.' };
            }
        } else {
            const users = getUsers();
            const user = users.find((item) => item.email === email && item.password === password);
            if (user) {
                setCurrentUser({...user, type: 'customer' });
                return { success: true, user: {...user, type: 'customer' } };
            } else {
                return { success: false, error: 'Email or password is incorrect. Please try again.' };
            }
        }
    }
}

async function handleIndexRegister(email, password, firstName, lastName, phone, company) {
    if (!validateEmail(email)) {
        return { success: false, error: 'Please enter a valid email address.' };
    }
    if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
        // Try to register via backend API
        const response = await fetch('http://localhost:8080/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'register',
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                phone,
                company_name: company
            })
        });

        const result = await response.json();

        if (result.success) {
            // Store user data in localStorage for frontend compatibility
            const users = getUsers();
            users.push(result.user);
            setUsers(users);
            setCurrentUser(result.user);
            return { success: true, user: result.user };
        } else {
            return { success: false, error: result.error || 'Registration failed. Please try again.' };
        }
    } catch (error) {
        // Fallback to localStorage if backend is not available
        const users = getUsers();
        const existing = users.find((user) => user.email === email);
        if (existing) {
            return { success: false, error: 'This email is already registered. Please log in instead.' };
        }

        const newUser = {
            email,
            password,
            first_name: firstName || 'Customer',
            last_name: lastName || '',
            company_name: company || 'N/A',
            phone: phone || 'N/A',
            invoices: [],
            service_requests: []
        };

        users.push(newUser);
        setUsers(users);
        setCurrentUser({...newUser, type: 'customer' });
        return { success: true, user: {...newUser, type: 'customer' } };
    }
}

async function logout() {
    try {
        // Call backend logout API
        const current = getCurrentUser();
        if (current && current.token) {
            await fetch('http://localhost:8080/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': current.token
                }
            });
        }
    } catch (error) {
        // Continue with local logout if backend is not available
    }
    
    clearCurrentUser();
    clearAdminReturnSession();
    window.location.href = 'index.html';
}

function saveCurrentUserChanges(user) {
    if (!user || user.type !== 'customer') return;
    const users = getUsers();
    const index = users.findIndex((item) => item.email === user.email);
    if (index >= 0) {
        users[index] = user;
        setUsers(users);
    }
    setCurrentUser({...user, type: 'customer' });
}

async function addServiceRequest(form) {
    const current = getCurrentUser();
    if (!current || current.type !== 'customer') {
        window.location.href = 'login.html';
        return;
    }

    const type = form.service_type.value;
    const date = form.requested_date.value || 'Flexible';
    const description = form.description.value.trim();
    const notice = document.getElementById('service-request-notice');

    hideNotice(notice);

    if (!type || !description) {
        showNotice(notice, 'Please select a service type and provide a description.', true);
        return;
    }

    try {
        // Try to add service request via backend API
        const response = await fetch('http://localhost:8080/api/service-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': current.token
            },
            body: JSON.stringify({
                service_type: type,
                description,
                requested_date: date
            })
        });

        const result = await response.json();

        if (result.success) {
            // Update local storage for frontend compatibility
            current.service_requests = current.service_requests || [];
            current.service_requests.push({
                id: result.request.id,
                service_type: type,
                requested_date: date,
                description,
                status: 'Pending'
            });
            saveCurrentUserChanges(current);

            showNotice(notice, 'Your service request was submitted successfully.', false);
            form.reset();
            renderCustomerDashboard(current);
        } else {
            showNotice(notice, result.error || 'Failed to submit service request. Please try again.', true);
        }
    } catch (error) {
        // Fallback to localStorage if backend is not available
        const request = {
            id: Date.now(),
            service_type: type,
            requested_date: date,
            description,
            status: 'Pending'
        };

        current.service_requests = current.service_requests || [];
        current.service_requests.push(request);
        saveCurrentUserChanges(current);

        showNotice(notice, 'Your service request was submitted successfully.', false);
        form.reset();
        renderCustomerDashboard(current);
    }
}

function renderCustomerDashboard(current) {
    if (!current) return;
    const welcome = document.getElementById('customer-welcome');
    const invoiceCount = document.getElementById('invoice-count');
    const pendingAmount = document.getElementById('pending-amount');
    const paidAmount = document.getElementById('paid-amount');
    const activeRequests = document.getElementById('active-requests');
    const infoName = document.getElementById('info-name');
    const infoCompany = document.getElementById('info-company');
    const infoEmail = document.getElementById('info-email');
    const infoPhone = document.getElementById('info-phone');

    const invoices = current.invoices || [];
    const requests = current.service_requests || [];
    const pending = invoices.filter((invoice) => invoice.status !== 'Paid').reduce((total, invoice) => total + parseFloat(invoice.amount || 0), 0);
    const paid = invoices.filter((invoice) => invoice.status === 'Paid').reduce((total, invoice) => total + parseFloat(invoice.amount || 0), 0);

    if (welcome) welcome.textContent = `Welcome, ${current.first_name || 'Customer'}!`;
    if (invoiceCount) invoiceCount.textContent = invoices.length.toString();
    if (pendingAmount) pendingAmount.textContent = `$${pending.toFixed(2)}`;
    if (paidAmount) paidAmount.textContent = `$${paid.toFixed(2)}`;
    if (activeRequests) activeRequests.textContent = requests.length.toString();

    if (infoName) infoName.textContent = `${current.first_name || '--'} ${current.last_name || ''}`.trim() || '-- Login to view --';
    if (infoCompany) infoCompany.textContent = current.company_name || '-- Login to view --';
    if (infoEmail) infoEmail.textContent = current.email || '-- Login to view --';
    if (infoPhone) infoPhone.textContent = current.phone || '-- Login to view --';

    const invoiceBody = document.getElementById('invoice-table-body');
    if (invoiceBody) {
        invoiceBody.innerHTML = '';
        if (invoices.length === 0) {
            invoiceBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px;"><div class="empty-state"><div class="empty-state-icon">📄</div><p>No invoices available yet. Add invoices from admin portal.</p></div></td></tr>`;
        } else {
            invoices.forEach((invoice) => {
                invoiceBody.innerHTML += `<tr><td>${invoice.number}</td><td>${invoice.date}</td><td>$${parseFloat(invoice.amount).toFixed(2)}</td><td>${invoice.status}</td><td><span class="action-links">${invoice.status === 'Paid' ? 'Paid' : 'Pending'}</span></td></tr>`;
            });
        }
    }

    const requestBody = document.getElementById('request-table-body');
    if (requestBody) {
        requestBody.innerHTML = '';
        if (requests.length === 0) {
            requestBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px;"><div class="empty-state"><div class="empty-state-icon">🛠️</div><p>No service requests yet. Submit a request below to get started.</p></div></td></tr>`;
        } else {
            requests.forEach((request) => {
                requestBody.innerHTML += `<tr><td>${request.service_type.replace(/_/g, ' ')}</td><td>${request.description}</td><td>${request.requested_date}</td><td>${request.status}</td></tr>`;
            });
        }
    }
}

function ensureCustomerSession() {
    const current = getCurrentUser();
    if (!current || current.type !== 'customer') {
        const container = document.createElement('div');
        container.style.padding = '40px';
        container.style.textAlign = 'center';
        container.style.fontFamily = 'Arial, sans-serif';
        container.innerHTML = `<h1 style="font-size:2rem;margin-bottom:1rem;">Please log in to continue</h1><p style="margin-bottom:1.5rem;color:#4b5563;">You must sign in as a customer to access this dashboard.</p><a href="index.html" style="display:inline-block;padding:14px 24px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;">Go to Login</a>`;
        document.body.innerHTML = '';
        document.body.appendChild(container);
        return;
    }
    renderCustomerDashboard(current);
}

function ensureAdminSession() {
    const current = getCurrentUser();
    if (!current || current.type !== 'admin') {
        const container = document.createElement('div');
        container.style.padding = '40px';
        container.style.textAlign = 'center';
        container.style.fontFamily = 'Arial, sans-serif';
        container.innerHTML = `<h1 style="font-size:2rem;margin-bottom:1rem;">Admin access required</h1><p style="margin-bottom:1.5rem;color:#4b5563;">Please sign in with admin account to access this dashboard.</p><a href="index.html" style="display:inline-block;padding:14px 24px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;">Go to Login</a>`;
        document.body.innerHTML = '';
        document.body.appendChild(container);
        return;
    }

    const stats = {
        totalCustomers: getUsers().length,
        totalInvoices: getUsers().reduce((acc, user) => acc + (user.invoices ? user.invoices.length : 0), 0),
        amountPaid: getUsers().reduce((acc, user) => acc + (user.invoices ? user.invoices.filter((invoice) => invoice.status === 'Paid').reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) : 0), 0),
        amountPending: getUsers().reduce((acc, user) => acc + (user.invoices ? user.invoices.filter((invoice) => invoice.status !== 'Paid').reduce((sum, item) => sum + parseFloat(item.amount || 0), 0) : 0), 0),
        pendingRequests: getUsers().reduce((acc, user) => acc + (user.service_requests ? user.service_requests.filter((req) => req.status === 'Pending').length : 0), 0)
    };

    const totalCustomers = document.getElementById('admin-total-customers');
    const totalInvoices = document.getElementById('admin-total-invoices');
    const amountPaid = document.getElementById('admin-amount-paid');
    const amountPending = document.getElementById('admin-amount-pending');
    const pendingRequests = document.getElementById('admin-pending-requests');

    if (totalCustomers) totalCustomers.textContent = stats.totalCustomers.toString();
    if (totalInvoices) totalInvoices.textContent = stats.totalInvoices.toString();
    if (amountPaid) amountPaid.textContent = `$${stats.amountPaid.toFixed(2)}`;
    if (amountPending) amountPending.textContent = `$${stats.amountPending.toFixed(2)}`;
    if (pendingRequests) pendingRequests.textContent = stats.pendingRequests.toString();

    const customerBody = document.getElementById('admin-customer-body');
    const serviceRequestsBody = document.getElementById('admin-requests-body');
    const users = getUsers();

    if (customerBody) {
        customerBody.innerHTML = '';
        if (users.length === 0) {
            customerBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:18px; color:#6b7280;">No customers loaded yet.</td></tr>';
        } else {
            users.forEach((user) => {
                const invoices = (user.invoices || []).length;
                const requests = (user.service_requests || []).length;
                customerBody.innerHTML += `
                  <tr>
                    <td>${user.company_name || 'N/A'}</td>
                    <td>${(user.first_name || '')} ${(user.last_name || '')}</td>
                    <td>${user.email}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>${invoices}</td>
                    <td>${requests}</td>
                    <td>
                      <div class="action-links" style="display:flex; gap: 8px; flex-wrap:wrap;">
                        <button class="btn dark" type="button" data-action="view" data-email="${user.email}" style="padding:8px 10px;">View</button>
                        <button class="btn dark" type="button" data-action="portal" data-email="${user.email}" style="padding:8px 10px;">Open portal</button>
                        <button class="btn" type="button" data-action="reset" data-email="${user.email}" style="padding:8px 10px;">Reset password</button>
                        <button class="btn" type="button" data-action="delete" data-email="${user.email}" style="padding:8px 10px; border-color: rgba(239,68,68,.28); background: rgba(239,68,68,.12);">Delete</button>
                      </div>
                    </td>
                  </tr>
                `;
            });
        }

        if (!customerBody.dataset.bound) {
            customerBody.dataset.bound = 'true';
            customerBody.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) return;
                const button = target.closest('button[data-action][data-email]');
                if (!button) return;

                const action = button.getAttribute('data-action');
                const email = button.getAttribute('data-email');
                if (!action || !email) return;

                const usersNow = getUsers();
                const customer = usersNow.find((u) => u.email === email);
                if (!customer) {
                    alert('Customer not found.');
                    ensureAdminSession();
                    return;
                }

                if (action === 'view') {
                    alert(`Customer Details:\n\nName: ${customer.first_name} ${customer.last_name}\nEmail: ${customer.email}\nCompany: ${customer.company_name}\nPhone: ${customer.phone}\n\nInvoices: ${customer.invoices ? customer.invoices.length : 0}\nService Requests: ${customer.service_requests ? customer.service_requests.length : 0}`);
                    return;
                }

                if (action === 'portal') {
                    alert('Customer portal access would be implemented here.');
                    return;
                }

                if (action === 'reset') {
                    const temp = 'Temp-' + Math.random().toString(36).substring(2, 12).toUpperCase();
                    customer.password = temp;
                    setUsers(usersNow);
                    alert(`Temporary password created for ${email}:\n\n${temp}\n\nShare this with the customer, and have them log in and change it.`);
                    ensureAdminSession();
                    return;
                }

                if (action === 'delete') {
                    const ok = confirm(`Delete customer account for ${email}?\n\nThis removes customer, invoices, and service requests from this browser.`);
                    if (ok) {
                        const next = usersNow.filter((u) => u.email !== email);
                        setUsers(next);
                        ensureAdminSession();
                    }
                    return;
                }
            });
        }
    }

    // Populate service requests table
    if (serviceRequestsBody) {
        serviceRequestsBody.innerHTML = '';
        const allRequests = [];
        users.forEach((user) => {
            if (user.service_requests) {
                user.service_requests.forEach((request, index) => {
                    allRequests.push({
                        customerEmail: user.email,
                        customerName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                        ...request,
                        requestIndex: index
                    });
                });
            }
        });

        if (allRequests.length === 0) {
            serviceRequestsBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:18px; color:#6b7280;">No service requests found.</td></tr>';
        } else {
            allRequests.forEach((request) => {
                const statusClass = request.status === 'Pending' ? 'warn' : request.status === 'Accepted' ? 'good' : '';
                serviceRequestsBody.innerHTML += `
                  <tr>
                    <td>${request.customerName}</td>
                    <td>${String(request.service_type || '').replace(/_/g, ' ')}</td>
                    <td>${request.description}</td>
                    <td>${request.requested_date}</td>
                    <td><span class="pill ${statusClass}">${request.status}</span></td>
                    <td>
                      ${request.status === 'Pending' ? `<button class="accept-btn" onclick="acceptServiceRequest('${request.customerEmail}', ${request.requestIndex})">Accept</button>` : ''}
                    </td>
                  </tr>
                `;
            });
        }
    }
}

function acceptServiceRequest(customerEmail, requestIndex) {
    const users = getUsers();
    const customer = users.find(user => user.email === customerEmail);
    if (customer && customer.service_requests && customer.service_requests[requestIndex]) {
        customer.service_requests[requestIndex].status = 'Accepted';
        setUsers(users);
        ensureAdminSession(); // Refresh dashboard
    }
}

// Dashboard helper functions
function refreshDashboard() {
    const current = getCurrentUser();
    if (current && current.type === 'customer') {
        renderCustomerDashboard(current);
    } else if (current && current.type === 'admin') {
        ensureAdminSession();
    }
}

function refreshCustomers() {
    ensureAdminSession();
}

function refreshRequests() {
    ensureAdminSession();
}

function refreshInvoices() {
    const current = getCurrentUser();
    if (current && current.type === 'customer') {
        renderCustomerDashboard(current);
    }
}

function exportCustomers() {
    const users = getUsers();
    const csv = [
        ['Company', 'Name', 'Email', 'Phone', 'Invoices', 'Requests'],
        ...users.map(u => [
            u.company_name || 'N/A',
            `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A',
            u.email,
            u.phone || 'N/A',
            (u.invoices || []).length,
            (u.service_requests || []).length
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportInvoices() {
    const current = getCurrentUser();
    if (!current || !current.invoices) return;
    
    const csv = [
        ['Invoice #', 'Date', 'Amount', 'Status'],
        ...current.invoices.map(inv => [
            inv.number,
            inv.date,
            inv.amount,
            inv.status
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${current.email}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportRequests() {
    const users = getUsers();
    const allRequests = [];
    users.forEach((user) => {
        if (user.service_requests) {
            user.service_requests.forEach((request) => {
                allRequests.push({
                    customerEmail: user.email,
                    customerName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                    ...request
                });
            });
        }
    });
    
    const csv = [
        ['Customer', 'Service Type', 'Description', 'Requested Date', 'Status'],
        ...allRequests.map(r => [
            r.customerName,
            String(r.service_type || '').replace(/_/g, ' '),
            r.description,
            r.requested_date,
            r.status
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function generateReport() {
    const users = getUsers();
    const totalCustomers = users.length;
    const totalInvoices = users.reduce((acc, user) => acc + (user.invoices ? user.invoices.length : 0), 0);
    const totalRevenue = users.reduce((acc, user) => acc + (user.invoices ? user.invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0) : 0), 0);
    const pendingRequests = users.reduce((acc, user) => acc + (user.service_requests ? user.service_requests.filter((req) => req.status === 'Pending').length : 0), 0);
    
    alert(`Business Report\n\nTotal Customers: ${totalCustomers}\nTotal Invoices: ${totalInvoices}\nTotal Revenue: $${totalRevenue.toFixed(2)}\nPending Service Requests: ${pendingRequests}\n\nGenerated on: ${new Date().toLocaleDateString()}`);
}

function showAddCustomerModal() {
    window.location.href = 'register.html';
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', () => {
    // Handle logout button
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Handle customer registration form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            registerCustomer(registerForm);
        });
    }

    // Handle customer login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginCustomer(loginForm);
        });
    }

    // Handle admin login form
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginAdmin(adminLoginForm);
        });
    }

    // Handle service request form
    const serviceRequestForm = document.getElementById('service-request-form');
    if (serviceRequestForm) {
        serviceRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addServiceRequest(serviceRequestForm);
        });
    }

    // Handle invoice creation form
    const invoiceForm = document.getElementById('invoice-form');
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const current = getCurrentUser();
            if (!current || current.type !== 'admin') {
                window.location.href = 'index.html';
                return;
            }

            const customerId = invoiceForm.customer_id.value.trim();
            const invoiceNumber = invoiceForm.invoice_number.value.trim();
            const description = invoiceForm.description.value.trim();
            const amount = parseFloat(invoiceForm.amount.value);
            const dueDate = invoiceForm.due_date.value;
            const notice = document.getElementById('invoice-submit-notice');

            hideNotice(notice);

            if (!customerId || !invoiceNumber || !description || !amount || !dueDate) {
                showNotice(notice, 'Please fill in all required fields.', true);
                return;
            }

            try {
                // Try to create invoice via backend API
                const response = await fetch('http://localhost:8080/api/invoices', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Auth-Token': current.token
                    },
                    body: JSON.stringify({
                        customer_id: customerId,
                        invoice_number: invoiceNumber,
                        description,
                        amount,
                        due_date: dueDate
                    })
                });

                const result = await response.json();

                if (result.success) {
                    showNotice(notice, 'Invoice created successfully.', false);
                    invoiceForm.reset();
                    ensureAdminSession();
                } else {
                    showNotice(notice, result.error || 'Failed to create invoice. Please try again.', true);
                }
            } catch (error) {
                // Fallback to localStorage if backend is not available
                const users = getUsers();
                const customer = users.find(u => 
                    u.email === customerId || 
                    u.company_name.toLowerCase() === customerId.toLowerCase()
                );

                if (!customer) {
                    showNotice(notice, 'Customer not found. Please check the email or company name.', true);
                    return;
                }

                const newInvoice = {
                    number: invoiceNumber,
                    date: new Date().toISOString().split('T')[0],
                    amount: amount.toString(),
                    due_date: dueDate,
                    description,
                    status: 'Pending'
                };

                customer.invoices = customer.invoices || [];
                customer.invoices.push(newInvoice);
                setUsers(users);

                showNotice(notice, 'Invoice created successfully.', false);
                invoiceForm.reset();
                ensureAdminSession();
            }
        });
    }

    // Initialize dashboards
    if (document.body.dataset.page === 'customer-dashboard') {
        // Customer dashboard initialization is handled in the dashboard script
    } else if (document.body.dataset.page === 'admin-dashboard') {
        // Admin dashboard initialization is handled in the dashboard script
    }
});
