import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api.js";
import { Spinner } from "../components/ui/index.jsx";

/**
 * Landing page for Google OAuth callback.
 *
 * Flow:
 *   Google → backend callback → redirect to /auth/callback?token=xxx&provider=google
 *   This page reads the token, fetches the user profile, stores the token,
 *   then redirects to /dashboard.
 *
 * The token is in the URL for the briefest moment — we consume it immediately
 * and replace the history entry so it doesn't sit in the browser history.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handle = async () => {
      const params   = new URLSearchParams(window.location.search);
      const token    = params.get("token");
      const oauthErr = params.get("error");

      // Backend sent an error
      if (oauthErr) {
        setError(decodeURIComponent(oauthErr));
        setTimeout(() => navigate("/login", { replace: true }), 2500);
        return;
      }

      // No token — shouldn't happen, but guard anyway
      if (!token) {
        setError("No token received from Google. Please try again.");
        setTimeout(() => navigate("/login", { replace: true }), 2500);
        return;
      }

      // Store access token immediately and clear it from the URL
      localStorage.setItem("accessToken", token);
      window.history.replaceState({}, "", "/auth/callback");

      // Verify token is valid by fetching the user profile
      try {
        await authApi.me();               // sets Authorization header via interceptor
        navigate("/dashboard", { replace: true });
      } catch {
        localStorage.removeItem("accessToken");
        setError("Sign-in failed. Please try again.");
        setTimeout(() => navigate("/login", { replace: true }), 2500);
      }
    };

    handle();
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{
        background: "#F5F3EF",
        fontFamily: "'Work Sans', sans-serif",
      }}
    >
      {error ? (
        <>
          <div
            className="rounded-lg px-5 py-3 text-sm font-medium"
            style={{ background: "rgba(226,96,79,0.08)", color: "#C04030", border: "1px solid rgba(226,96,79,0.2)" }}
          >
            {error}
          </div>
          <p className="text-xs" style={{ color: "#8FA3B1" }}>Redirecting to login…</p>
        </>
      ) : (
        <>
          <Spinner size={32} />
          <p className="text-sm font-medium" style={{ color: "#8FA3B1" }}>
            Signing you in with Google…
          </p>
        </>
      )}
    </div>
  );
}