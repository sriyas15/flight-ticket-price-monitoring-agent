import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/auth.api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until session restored

  // ── Restore session on mount ──────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await authApi.me();
        setUser(data.data.user);
      } catch {
        // Token invalid/expired — interceptor will try refresh;
        // if that also fails it clears storage and redirects.
        localStorage.removeItem("accessToken");
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────
  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    localStorage.setItem("accessToken", data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const login = useCallback(async (payload) => {
    const { data } = await authApi.login(payload);
    localStorage.setItem("accessToken", data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* best-effort */ }
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);

  const value = { user, loading, register, login, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
