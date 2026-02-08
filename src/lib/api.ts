import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Auth Errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('isAdminLoggedIn');
            localStorage.removeItem('isExternalLoggedIn');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userType');
            localStorage.removeItem('username');
            localStorage.removeItem('profession');
            
            // Redirect based on user type
            const userType = localStorage.getItem('userType');
            if (userType === 'external') {
                window.location.href = '/';
            } else {
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
