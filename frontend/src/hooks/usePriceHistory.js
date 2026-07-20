import { useState, useCallback } from "react";
import { routesApi } from "../api/routes.api.js";

/**
 * Fetches price history for a route on demand (not on mount).
 * Call fetchHistory(routeId) when the chart panel opens.
 */
export const usePriceHistory = () => {
  const [history, setHistory]   = useState({});   // keyed by routeId
  const [loading, setLoading]   = useState({});
  const [error, setError]       = useState({});

  const fetchHistory = useCallback(async (routeId, limit = 30) => {
    if (loading[routeId]) return;                  // already in flight
    setLoading((p) => ({ ...p, [routeId]: true }));
    setError((p)   => ({ ...p, [routeId]: null }));
    try {
      const { data } = await routesApi.getPriceHistory(routeId, limit);
      setHistory((p) => ({ ...p, [routeId]: data.data.history }));
    } catch (err) {
      setError((p) => ({
        ...p,
        [routeId]: err.response?.data?.message || "Failed to load price history",
      }));
    } finally {
      setLoading((p) => ({ ...p, [routeId]: false }));
    }
  }, [loading]);

  return {
    getHistory: (routeId) => history[routeId] ?? [],
    isLoading:  (routeId) => !!loading[routeId],
    getError:   (routeId) => error[routeId] ?? null,
    fetchHistory,
  };
};