import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
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

// Auth API
export const login = (username, password) => api.post('/auth/login', { username, password });
export const register = (userData) => api.post('/auth/register', userData);
export const getUserProfile = () => api.get('/auth/profile');

// Machines API
export const getAllMachines = () => api.get('/machines');
export const getMachine = (id) => api.get(`/machines/${id}`);
export const updateMachine = (id, data) => api.put(`/machines/${id}`, data);
export const restoreMachine = (id) => api.post(`/machines/${id}/restore`);
export const getMachineMaintenanceHistory = (id) => api.get(`/machines/${id}/maintenance`);
export const addMaintenanceRecord = (id, data) => api.post(`/machines/${id}/maintenance`, data);

// Simulation API
export const startSimulation = () => api.post('/simulation/start');
export const stopSimulation = () => api.post('/simulation/stop');
export const generateCriticalEvent = (id, parameter) => api.post(`/simulation/critical-event/${id}`, { parameter });

export default api;