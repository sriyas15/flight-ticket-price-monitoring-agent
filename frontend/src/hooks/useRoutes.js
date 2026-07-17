import { useState, useEffect, useCallback } from "react";
import { routesApi } from "../api/routes.api.js";
import { useAuth } from "../context/AuthContext.jsx";

export const useRoutes = () => {
  const { isAuthenticated } = useAuth();
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchRoutes = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await routesApi.getAll();
      setRoutes(data.data.routes);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const createRoute = useCallback(async (payload) => {
    const { data } = await routesApi.create(payload);
    setRoutes((prev) => [data.data.route, ...prev]);
    return data.data.route;
  }, []);

  const updateRoute = useCallback(async (id, payload) => {
    const { data } = await routesApi.update(id, payload);
    setRoutes((prev) => prev.map((r) => (r._id === id ? data.data.route : r)));
    return data.data.route;
  }, []);

  const deleteRoute = useCallback(async (id) => {
    await routesApi.delete(id);
    setRoutes((prev) => prev.filter((r) => r._id !== id));
  }, []);

  return { routes, loading, error, fetchRoutes, createRoute, updateRoute, deleteRoute };
};
