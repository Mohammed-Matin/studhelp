import axios from 'axios';
import { config } from '../config/config';

const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/user/rotate-token') {
      originalRequest._retry = true;

      try {
        await axiosInstance.post('/user/rotate-token');
        return axiosInstance(originalRequest);
      } catch (rotationError) {
        // Handle rotation failure (e.g., redirect to login)
        window.location.href = '/login';
        return Promise.reject(rotationError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
