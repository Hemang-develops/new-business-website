import axios from 'axios';
import { API } from '../config';

const apiClient = axios.create({
  baseURL: API.BASE_URL,
  timeout: 10000,
});

// Add request interceptor for authentication if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const orderAPI = {
  create: (orderData) => apiClient.post('/orders', orderData),
  getById: (id) => apiClient.get(`/orders/${id}`),
};

export const stripeAPI = {
  createPaymentIntent: (amount, currency) =>
    apiClient.post('/stripe/payment-intent', { amount, currency }),
};

export default apiClient;
