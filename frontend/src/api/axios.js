import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly refresh cookie automatically
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach access token ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — handle 401, refresh & retry ───────────────────
let _isRefreshing = false;
let _queue = []; // queued requests waiting for new token

const processQueue = (error, token = null) => {
  _queue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  _queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only handle 401s that haven't already been retried
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Don't refresh on the auth endpoints themselves — but DO refresh /auth/me
    const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];
    if (NO_REFRESH_PATHS.some((path) => original.url?.includes(path))) {
      return Promise.reject(error);
    }

    if (_isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        _queue.push({ resolve, reject });
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        })
        .catch(Promise.reject);
    }

    original._retry = true;
    _isRefreshing = true;

    try {
      const { data } = await api.post("/auth/refresh");
      const newToken = data.data.accessToken;
      localStorage.setItem("accessToken", newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      _isRefreshing = false;
    }
  }
);

export default api;
