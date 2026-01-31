import axios from 'axios';

// In development, default to localhost. In production, default to relative path (assuming proxy/rewrite) if env var is missing.
const defaultUrl = import.meta.env.DEV ? 'http://localhost:5001' : '';
const envUrl = import.meta.env.VITE_API_URL || defaultUrl;
const baseURL = envUrl;

const api = axios.create({
    baseURL: baseURL.endsWith('/api') ? baseURL : (baseURL ? `${baseURL.replace(/\/$/, '')}/api` : '/api'),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            // Check if we are already on login page to avoid infinite loop
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
