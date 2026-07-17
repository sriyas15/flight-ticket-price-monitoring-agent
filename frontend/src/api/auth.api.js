import api from "./axios.js";

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post("/auth/reset-password", { token, password }),
};
