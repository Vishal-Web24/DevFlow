import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  //  baseURL: '/api',
  baseURL: import.meta.env.VITE_API_URL,
});

// ─── Request interceptor: attach token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: auto-refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v: string) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original._retry) {
      const data = error.response.data as { code?: string };
      if (data?.code === "TOKEN_EXPIRED") {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          });
        }

        original._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          // const { data } = await axios.post("/api/auth/refresh", {
          //   refreshToken,
          // });
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            {
              refreshToken,
            },
          );
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          processQueue(null, data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Non-expiry 401 → redirect to login
      localStorage.clear();
      window.location.href = "/login";
    }

    // Show error toast for server errors (skip auth errors)
    if (error.response?.status && error.response.status >= 500) {
      toast.error("Server error. Please try again.");
    }

    return Promise.reject(error);
  },
);

export default api;
