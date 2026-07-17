import { useState, useEffect, useCallback } from "react";
import { alertsApi } from "../api/alerts.api.js";
import { useAuth } from "../context/AuthContext.jsx";

export const useAlerts = (limit = 20) => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await alertsApi.getMyAlerts(limit);
      setAlerts(data.data.logs);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, limit]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  return { alerts, loading, error, refetch: fetchAlerts };
};
