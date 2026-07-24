import { useState, useCallback } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export const useUser = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const updateProfile = useCallback(async (payload) => {
    clearMessages();
    setLoading(true);
    try {
      const { data } = await api.patch("/users/me", payload);
      setSuccess("Profile updated successfully.");
      return data.data.user;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const connectTelegram = useCallback(async (telegramChatId) => {
    clearMessages();
    setLoading(true);
    try {
      const { data } = await api.patch("/users/me/telegram", { telegramChatId });
      setSuccess("Telegram connected! Check your Telegram for a confirmation message.");
      return data.data.user;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to connect Telegram.");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const disconnectTelegram = useCallback(async () => {
    clearMessages();
    setLoading(true);
    try {
      const { data } = await api.delete("/users/me/telegram");
      setSuccess("Telegram disconnected.");
      return data.data.user;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to disconnect Telegram.");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const changePassword = useCallback(async (payload) => {
    clearMessages();
    setLoading(true);
    try {
      await api.patch("/users/me/password", payload);
      setSuccess("Password changed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const deleteAccount = useCallback(async (password) => {
    clearMessages();
    setLoading(true);
    try {
      await api.delete("/users/me", { data: { password } });
      // Wipe local session — auth context logout handles redirect
      await logout();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account.");
      setLoading(false);
      throw err;
    }
    // Don't setLoading(false) on success — page will unmount via logout redirect
  }, [logout]);

  const updateNotifyHour = useCallback(async (notifyHour) => {
    clearMessages();
    setLoading(true);
    try {
      const { data } = await api.patch("/users/me/notify-hour", { notifyHour });
      setSuccess("Notification time saved.");
      return data.data.user;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save notification time.");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const sendTestAlert = useCallback(async () => {
    clearMessages();
    setLoading(true);
    try {
      await api.post("/users/me/test-alert");
      setSuccess("Test alert sent! Check your Telegram.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send test alert.");
      throw err;
    } finally { setLoading(false); }
  }, []);

  return {
    user,
    loading,
    error,
    success,
    clearMessages,
    updateProfile,
    connectTelegram,
    disconnectTelegram,
    changePassword,
    deleteAccount,
    updateNotifyHour,
    sendTestAlert,
  };
};