import axios from 'axios';
import router from './router';

const apiBaseUrl = import.meta.env.VITE_SERVER_API_BASE_URL;
const casProgramID = import.meta.env.VITE_CAS_PROGRAM_ID;

const instance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: Function[] = [];

instance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access');

    if (isRefreshing) {
      return new Promise((resolve) => {
        addSubscriber((newToken: string | null) => {
          config.headers['Authorization'] = `Bearer ${newToken}`;
          config.headers['ProgramID'] = `${casProgramID}`;
          resolve(config);
        });
      });
    }

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
      config.headers['ProgramID'] = `${casProgramID}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          addSubscriber((newToken: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            resolve(instance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      let newAccessToken: null = null;
      try {
        newAccessToken = await refreshTokens();
        if (newAccessToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } else {
          return Promise.reject(error);
        }
      } catch (err) {
        console.error('Token refresh failed:', err);
        error.expiredToken = true
      } finally {
        isRefreshing = false;
        refreshSubscribers.forEach((callback) => callback(newAccessToken));
        refreshSubscribers = [];
      }
    }

    return Promise.reject(error);
  }
);

const refreshTokens = async () => {
  const refreshToken = localStorage.getItem('refresh');
  if (!refreshToken) {
    router.push('/login');
    return null;
  }

  try {
    const response = await axios.post(`${apiBaseUrl}token/refresh/`, {
      refresh: refreshToken,
    });

    const data = response.data;
    if (data) {
      const { access, refresh } = data;

      if (access) localStorage.setItem('access', access);
      if (refresh) localStorage.setItem('refresh', refresh);

      return access;
    }
    return null;

  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    router.push('/login');
    return null;
  }
};

const addSubscriber = (callback: Function) => {
  refreshSubscribers.push(callback);
};

export default instance;