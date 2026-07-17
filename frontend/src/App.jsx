import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import ProtectedRoute  from "./components/layout/ProtectedRoute.jsx";

// Pages
import AuthPage       from "./components/auth/AuthPage.jsx";
import DashboardPage  from "./pages/DashboardPage.jsx";
import AlertsPage     from "./pages/AlertsPage.jsx";
import SettingsPage   from "./pages/SettingsPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public routes ── */}
          <Route path="/login"  element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* ── Protected routes (require auth) ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/alerts"    element={<AlertsPage />} />
              <Route path="/settings"  element={<SettingsPage />} />
            </Route>
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
