import api from "./axios.js";

export const routesApi = {
  getAll: () => api.get("/flight-routes"),
  getOne: (id) => api.get(`/flight-routes/${id}`),
  create: (data) => api.post("/flight-routes", data),
  update: (id, data) => api.patch(`/flight-routes/${id}`, data),
  delete: (id) => api.delete(`/flight-routes/${id}`),
  getPriceHistory: (id, limit = 30) =>
    api.get(`/flight-routes/${id}/history?limit=${limit}`),
  getAlerts: (id) => api.get(`/flight-routes/${id}/alerts`),
};
