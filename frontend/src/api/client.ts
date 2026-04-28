import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardcoding the production URL to guarantee it connects to Render
const API_URL = 'https://nailbook-pro-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  console.log('[API CLIENT] Token status:', !!token);
  // Uncomment to debug token: console.log('[API CLIENT] Token preview:', token?.substring(0, 20));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
