import axios from 'axios';
import { config } from '../config/config';
import { getToken, setToken, clearToken } from '../utils/auth';

const axiosInstance = axios.create({
    baseURL: config.apiBaseUrl,
    withCredentials: true,
});

axiosInstance.interceptors.request.use(
    (reqConfig) => {
        const token = getToken();
        if (token) {
            reqConfig.headers.Authorization = `Bearer ${token}`;
        }
        return reqConfig;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== '/user/rotate-token' &&
            originalRequest.url !== '/user/login'
        ) {
            originalRequest._retry = true;

            try {
                const res = await axiosInstance.post('/user/rotate-token');
                const { token } = res.data;
                setToken(token);
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            } catch (rotationError) {
                clearToken();
                window.location.href = '/login';
                return Promise.reject(rotationError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
