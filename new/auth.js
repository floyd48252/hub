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
    // Also store token for API calls
    if (user && user.token) {
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    }
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

function resetCustomerPasswordSelfService(form) {
    const notice = document.getElementById('forgot-notice');
    hideNotice(notice);

    const email = form.email.value.trim().toLowerCase();
    const companyOrPhone = (form.company_or_phone?.value || '').trim().toLowerCase();
    const nextPassword = form.new_password.value;
    const confirm = form.confirm_password.value;

    if (!validateEmail(email)) {
        showNotice(notice, 'Please enter a valid email address.', true);
        return;
    }
    if (!nextPassword || nextPassword.length < 6) {
        showNotice(notice, 'New password must be at least 6 characters.', true);
        return;
    }
    if (nextPassword !== confirm) {
        showNotice(notice, 'New password and confirmation do not match.', true);
        return;
    }

    const users = getUsers();
    const index = users.findIndex((u) => u.email === email);
    if (index < 0) {
        showNotice(notice, 'No account found for that email.', true);
        return;
    }

    const u = users[index];
    const company = String(u.company_name || '').trim().toLowerCase();
    const phone = String(u.phone || '').trim().toLowerCase();

    // Since this is a demo (no email), we do a lightweight verification.
    // If user has company or phone stored, require a match to avoid blind resets.
    const hasCheck = (company && company !== 'n/a') || (phone && phone !== 'n/a');
    const matches = !hasCheck
        ? true
        : (companyOrPhone && (companyOrPhone === company || companyOrPhone === phone));

    if (!matches) {
        showNotice(notice, 'Verification failed. Enter the company name or phone used during registration.', true);
        return;
    }

    users[index].password = nextPassword;
    setUsers(users);
    showNotice(notice, 'Password updated. You can now log in.', false);
    form.reset();
}

function resetAdminPasswordWithRecovery(form) {
    const notice = document.getElementById('admin-forgot-notice');
    hideNotice(notice);

    const email = form.email.value.trim().toLowerCase();
    const recovery = form.recovery_code.value.trim();
    const nextPassword = form.new_password.value;
    const confirm = form.confirm_password.value;

    if (!validateEmail(email)) {
        showNotice(notice, 'Please enter a valid email address.', true);
        return;
    }
    if (!recovery || recovery.length < 8) {
        showNotice(notice, 'Enter your admin recovery code.', true);
        return;
    }
    if (!nextPassword || nextPassword.length < 6) {
        showNotice(notice, 'New password must be at least 6 characters.', true);
        return;
    }
    if (nextPassword !== confirm) {
        showNotice(notice, 'New password and confirmation do not match.', true);
        return;
    }

    const admin = getAdminCredentials();
    const storedRecovery = getAdminRecoveryCode();
    if (email !== admin.email) {
        showNotice(notice, 'Admin email does not match this browser setup.', true);
        return;
    }
    if (recovery !== storedRecovery) {
        showNotice(notice, 'Recovery code is incorrect.', true);
        return;
    }

    setAdminCredentials({ email: admin.email, password: nextPassword });
    showNotice(notice, 'Admin password updated. You can now sign in.', false);
    form.reset();
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
            invoiceBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px;"><div class="empty-state"><div class="empty-state-icon">📄</div><p>No invoices available yet. Add invoices from the admin portal.</p></div></td></tr>`;
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
        container.innerHTML = `<h1 style="font-size:2rem;margin-bottom:1rem;">Please log in to continue</h1><p style="margin-bottom:1.5rem;color:#4b5563;">You must sign in as a customer to access this dashboard.</p><a href="login.html" style="display:inline-block;padding:14px 24px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;">Go to Customer Login</a>`;
        document.body.innerHTML = '';
        document.body.appendChild(container);
        return;
    }
    renderCustomerDashboard(current);
}

function acceptServiceRequest(customerEmail, requestIndex) {
    const users = getUsers();
    const customer = users.find(user => user.email === customerEmail);
    if (customer && customer.service_requests && customer.service_requests[requestIndex]) {
        customer.service_requests[requestIndex].status = 'Accepted';
        setUsers(users);
        ensureAdminSession(); // Refresh the dashboard
    }
}

function openCustomerDialog(user) {
    const dialog = document.getElementById('customer-dialog');
    const sub = document.getElementById('customer-dialog-sub');
    const body = document.getElementById('customer-dialog-body');
    const close = document.getElementById('customer-dialog-close');
    if (!dialog || !sub || !body) return;

    const invoices = user.invoices || [];
    const requests = user.service_requests || [];
    const pendingInvoices = invoices.filter((inv) => inv.status !== 'Paid').length;
    const paidInvoices = invoices.filter((inv) => inv.status === 'Paid').length;
    const pendingRequests = requests.filter((r) => r.status === 'Pending').length;
    const acceptedRequests = requests.filter((r) => r.status === 'Accepted').length;

    sub.textContent = `${user.company_name || 'N/A'} • ${user.email}`;
    body.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(12, 1fr); gap: 10px;">
        <div style="grid-column: span 6;">
          <div style="font-weight:900; margin-bottom:4px;">Contact</div>
          <div>${(user.first_name || '')} ${(user.last_name || '')}</div>
          <div class="muted" style="margin-top:4px;">Phone: ${user.phone || 'N/A'}</div>
        </div>
        <div style="grid-column: span 6;">
          <div style="font-weight:900; margin-bottom:4px;">Activity</div>
          <div>Invoices: ${invoices.length} (paid: ${paidInvoices}, pending: ${pendingInvoices})</div>
          <div>Requests: ${requests.length} (pending: ${pendingRequests}, accepted: ${acceptedRequests})</div>
        </div>
        <div style="grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,.10); margin-top: 6px; padding-top: 10px;">
          <div style="font-weight:900; margin-bottom:6px;">Recent invoices</div>
          <div class="muted">${invoices.slice(-5).reverse().map((inv) => `${inv.number} • $${parseFloat(inv.amount || 0).toFixed(2)} • ${inv.status} • ${inv.date}`).join('<br>') || 'None'}</div>
        </div>
        <div style="grid-column: 1 / -1; border-top: 1px solid rgba(255,255,255,.10); margin-top: 6px; padding-top: 10px;">
          <div style="font-weight:900; margin-bottom:6px;">Recent requests</div>
          <div class="muted">${requests.slice(-5).reverse().map((r) => `${String(r.service_type || '').replace(/_/g,' ')} • ${r.status} • ${r.requested_date}`).join('<br>') || 'None'}</div>
        </div>
      </div>
    `;

    if (close && !close.dataset.bound) {
        close.dataset.bound = 'true';
        close.addEventListener('click', () => dialog.close());
    }
    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
    } else {
        // Fallback for older browsers
        dialog.setAttribute('open', 'open');
    }
}

function generateTempPassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 10; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return `Temp-${out}`;
}

function resetCustomerPasswordByEmail(email) {
    const users = getUsers();
    const index = users.findIndex((u) => u.email === email);
    if (index < 0) return null;

    const tempPassword = generateTempPassword();
    users[index].password = tempPassword;
    setUsers(users);
    return tempPassword;
}

function deleteCustomerByEmail(email) {
    const users = getUsers();
    const next = users.filter((u) => u.email !== email);
    setUsers(next);
}

function impersonateCustomerByEmail(email) {
    const current = getCurrentUser();
    if (!current || current.type !== 'admin') return false;

    const users = getUsers();
    const customer = users.find((u) => u.email === email);
    if (!customer) return false;

    setAdminReturnSession({ email: current.email, type: 'admin' });
    setCurrentUser({ ...customer, type: 'customer', impersonated_by: current.email });
    window.location.href = 'customer-dashboard.html';
    return true;
}

function returnToAdmin() {
    const ret = getAdminReturnSession();
    if (!ret || ret.type !== 'admin') return false;
    clearAdminReturnSession();
    setCurrentUser({ email: ret.email, type: 'admin' });
    window.location.href = 'admin-dashboard.html';
    return true;
}

function changeAdminPassword(form) {
    const notice = document.getElementById('admin-password-notice');
    hideNotice(notice);

    const currentPassword = form.admin_current_password.value;
    const nextPassword = form.admin_new_password.value;
    const confirm = form.admin_confirm_password.value;

    const admin = getAdminCredentials();
    if (currentPassword !== admin.password) {
        showNotice(notice, 'Current password is incorrect.', true);
        return;
    }
    if (!nextPassword || nextPassword.length < 6) {
        showNotice(notice, 'New password must be at least 6 characters.', true);
        return;
    }
    if (nextPassword !== confirm) {
        showNotice(notice, 'New password and confirmation do not match.', true);
        return;
    }
    if (nextPassword === currentPassword) {
        showNotice(notice, 'New password must be different from current password.', true);
        return;
    }

    setAdminCredentials({ email: admin.email, password: nextPassword });
    showNotice(notice, 'Admin password updated. Use it next time you sign in.', false);
    form.reset();
}

function ensureAdminSession() {
    const current = getCurrentUser();
    if (!current || current.type !== 'admin') {
        const container = document.createElement('div');
        container.style.padding = '40px';
        container.style.textAlign = 'center';
        container.style.fontFamily = 'Arial, sans-serif';
        container.innerHTML = `<h1 style="font-size:2rem;margin-bottom:1rem;">Admin access required</h1><p style="margin-bottom:1.5rem;color:#4b5563;">Please sign in with the admin account to access this dashboard.</p><a href="admin-login.html" style="display:inline-block;padding:14px 24px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;">Go to Admin Login</a>`;
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
    const invoiceBody = document.getElementById('admin-invoice-body');
    const serviceRequestsBody = document.getElementById('admin-service-requests-body');
    const users = getUsers();


    if (customerBody) {
        customerBody.innerHTML = '';
        if (users.length === 0) {
            customerBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:18px; color:#6b7280;">No customers loaded yet.</td></tr>';
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
                    openCustomerDialog(customer);
                    return;
                }

                if (action === 'portal') {
                    impersonateCustomerByEmail(email);
                    return;
                }

                if (action === 'reset') {
                    const temp = resetCustomerPasswordByEmail(email);
                    if (!temp) {
                        alert('Could not reset password.');
                        return;
                    }
                    alert(`Temporary password created for ${email}:\n\n${temp}\n\nShare this with the customer, and have them log in and change it.`);
                    ensureAdminSession();
                    return;
                }

                if (action === 'delete') {
                    const ok = confirm(`Delete customer account for ${email}?\n\nThis removes the customer, invoices, and service requests from this browser.`);
                    if (!ok) return;
                    deleteCustomerByEmail(email);
                    ensureAdminSession();
                }
            });
        }
    }

    if (invoiceBody) {
        invoiceBody.innerHTML = '';
        const invoices = users.flatMap((user) => (user.invoices || []).map((invoice) => ({ customer: user.company_name, ...invoice })));
        if (invoices.length === 0) {
            invoiceBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:18px; color:#6b7280;">No invoices found yet.</td></tr>';
        } else {
            invoices.forEach((invoice) => {
                invoiceBody.innerHTML += `<tr><td>${invoice.number}</td><td>${invoice.customer}</td><td>$${parseFloat(invoice.amount).toFixed(2)}</td><td>${invoice.status}</td><td>${invoice.date}</td></tr>`;
            });
        }
    }

    if (serviceRequestsBody) {
        serviceRequestsBody.innerHTML = '';
        const allRequests = users.flatMap((user) => (user.service_requests || []).map((request, index) => ({ customer: user.company_name, customerEmail: user.email, requestIndex: index, ...request })));
        if (allRequests.length === 0) {
            serviceRequestsBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:18px; color:#6b7280;">No service requests yet.</td></tr>';
        } else {
            allRequests.forEach((request) => {
                const typeLabel = request.service_type.replace(/_/g, ' ').toUpperCase();
                const actions = request.status === 'Pending' ? `<button class="accept-btn" data-customer="${request.customerEmail}" data-index="${request.requestIndex}">Accept</button>` : '--';
                serviceRequestsBody.innerHTML += `<tr><td>${request.customer}</td><td>${typeLabel}</td><td>${request.description.substring(0, 50)}${request.description.length > 50 ? '...' : ''}</td><td>${request.requested_date}</td><td><span style="padding:4px 8px; background:#fff3cd; color:#856404; border-radius:4px; font-size:0.85rem;">${request.status}</span></td><td>${actions}</td></tr>`;
            });
        }
    }
}

function exportInvoices() {
    const current = getCurrentUser();
    if (!current || current.type !== 'customer') return;

    const invoices = current.invoices || [];
    if (invoices.length === 0) {
        showNotification('No invoices to export', 'error');
        return;
    }

    // Create CSV content
    let csv = 'Invoice Number,Date,Amount,Status\n';
    invoices.forEach(invoice => {
        csv += `${invoice.number},${invoice.date},${invoice.amount},${invoice.status}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('Invoices exported successfully', 'success');
}

function refreshInvoices() {
    const current = getCurrentUser();
    if (!current || current.type !== 'customer') return;

    // Refresh invoice display
    renderCustomerDashboard(current);
    showNotification('Invoices refreshed', 'success');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        transition: all 0.3s ease;
    `;
        customer.invoices.push({
            number: invoiceNumber,
            description,
            amount: amount.toFixed(2),
            date: dueDate,
            status: 'Pending'
        });

        setUsers(users);
        showNotice(notice, 'Invoice created successfully.', false);
        form.reset();
        ensureAdminSession();
    }

window.logout = logout;
window.registerCustomer = registerCustomer;
window.loginCustomer = loginCustomer;
window.loginAdmin = loginAdmin;
window.addServiceRequest = addServiceRequest;
window.submitInvoiceForm = submitInvoiceForm;
window.acceptServiceRequest = acceptServiceRequest;
window.returnToAdmin = returnToAdmin;
window.resetCustomerPasswordSelfService = resetCustomerPasswordSelfService;
window.resetAdminPasswordWithRecovery = resetAdminPasswordWithRecovery;
window.changeAdminPassword = changeAdminPassword;
window.refreshDashboard = refreshDashboard;
window.exportCustomers = exportCustomers;
window.showAddCustomerModal = showAddCustomerModal;
window.hideAddCustomerModal = hideAddCustomerModal;
window.generateReport = generateReport;

window.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            registerCustomer(registerForm);
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            loginCustomer(loginForm);
        });
    }

    const adminForm = document.getElementById('admin-login-form');
    if (adminForm) {
        adminForm.addEventListener('submit', (event) => {
            event.preventDefault();
            loginAdmin(adminForm);
        });
    }

    const serviceForm = document.getElementById('service-request-form');
    if (serviceForm) {
        serviceForm.addEventListener('submit', (event) => {
            event.preventDefault();
            addServiceRequest(serviceForm);
        });
    }

    const invoiceForm = document.getElementById('invoice-form');
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', (event) => {
            event.preventDefault();
            submitInvoiceForm(invoiceForm);
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    const adminPasswordForm = document.getElementById('admin-password-form');
    if (adminPasswordForm) {
        adminPasswordForm.addEventListener('submit', (event) => {
            event.preventDefault();
            changeAdminPassword(adminPasswordForm);
        });
    }

    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', (event) => {
            event.preventDefault();
            resetCustomerPasswordSelfService(forgotForm);
        });
    }

    const adminForgotForm = document.getElementById('admin-forgot-form');
    if (adminForgotForm) {
        adminForgotForm.addEventListener('submit', (event) => {
            event.preventDefault();
            resetAdminPasswordWithRecovery(adminForgotForm);
        });
    }

    // Admin dashboard: show recovery code for password reset
    const adminRecoveryValue = document.getElementById('admin-recovery-value');
    if (adminRecoveryValue) {
        adminRecoveryValue.textContent = getAdminRecoveryCode();
    }
    const regen = document.getElementById('admin-recovery-regenerate');
    if (regen && !regen.dataset.bound) {
        regen.dataset.bound = 'true';
        regen.addEventListener('click', () => {
            const fresh = generateRecoveryCode();
            setAdminRecoveryCode(fresh);
            const el = document.getElementById('admin-recovery-value');
            if (el) el.textContent = fresh;
            alert('Recovery code regenerated. Store it somewhere safe.');
        });
    }

    if (document.body.dataset.page === 'customer-dashboard') {
        const current = getCurrentUser();
        const ret = getAdminReturnSession();
        if (current && current.type === 'customer' && current.impersonated_by && ret && ret.type === 'admin') {
            const headerActions = document.querySelector('.dash-actions');
            if (headerActions && !document.getElementById('return-admin-button')) {
                const btn = document.createElement('button');
                btn.id = 'return-admin-button';
                btn.type = 'button';
                btn.className = 'btn dark';
                btn.textContent = 'Return to Admin';
                btn.addEventListener('click', returnToAdmin);
                headerActions.prepend(btn);
            }
        }
        ensureCustomerSession();
    }
    if (document.body.dataset.page === 'admin-dashboard') {
        ensureAdminSession();
    }
});