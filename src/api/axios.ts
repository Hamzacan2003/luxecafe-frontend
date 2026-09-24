import axios from 'axios';

const api = axios.create({
    baseURL: 'https://luxecafe-backend.onrender.com/api',
});

// Giden her isteğe localStorage'daki token'ı ekle
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;