const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const getHeaders = (hasBody = false) => {
    const headers = {};
    if (hasBody) headers['Content-Type'] = 'application/json';

    // Auto-attach token if present
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('adminToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const api = {
    get: async (endpoint) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: getHeaders(false)
        });
        if (!res.ok) {
            // Check for auth error
            if (res.status === 401 || res.status === 403) {
                if (typeof window !== 'undefined') localStorage.removeItem('adminToken');
                const error = new Error('Unauthorized');
                error.status = res.status;
                throw error;
            }
            throw new Error(`API Error: ${res.statusText}`);
        }
        return res.json();
    },
    post: async (endpoint, data) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                if (typeof window !== 'undefined') localStorage.removeItem('adminToken');
                const error = new Error('Unauthorized');
                error.status = res.status;
                throw error;
            }
            throw new Error(`API Error: ${res.statusText}`);
        }
        return res.json();
    },
    upload: async (endpoint, formData) => {
        const headers = {};
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('adminToken');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
            headers: headers
        });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                if (typeof window !== 'undefined') localStorage.removeItem('adminToken');
                const error = new Error('Unauthorized');
                error.status = res.status;
                throw error;
            }
            throw new Error(`API Error: ${res.statusText}`);
        }
        return res.json();
    },
    // Secure logout - blacklists token on server before clearing locally
    logout: async () => {
        try {
            await fetch(`${API_URL}/api/logout`, {
                method: 'POST',
                headers: getHeaders(true),
                body: JSON.stringify({})
            });
        } catch (e) {
            // Continue even if API call fails
            console.error('Logout API error:', e);
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem('adminToken');
        }
    }
};
