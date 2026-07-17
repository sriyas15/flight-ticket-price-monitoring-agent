import api from "./axios.js";

export const alertsApi = {
  getMyAlerts: (limit = 20) => api.get(`/alerts?limit=${limit}`),
};
