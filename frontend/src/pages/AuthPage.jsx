import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { authApi } from "../../api/auth.api.js";
import { Field, Input, PrimaryBtn, ErrorBanner } from "../ui/index.jsx";

export default function AuthPage() {
  const { isAuthenticated, loading } = useAuth();
  const [view, setView] = useState("login"); // "login" | "register" | "forgot" | "forgot-sent"

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          "radial-gradient(circle at 20% 15%, rgba(242,169,59,0.08), transparent 40%), radial-gradient(circle at 85% 80%, rgba(79,174,132,0.06), transparent 45%), #F5F3EF",
        fontFamily: "'Work Sans', sans-serif",
      }}
    >
      {view === "forgot" || view === "forgot-sent" ? (
        <ForgotCard view={view} setView={setView} />
      ) : (
        <BoardingPassCard view={view} setView={setView} />
      )}
    </div>
  );
}

// ── Boarding pass card ─────────────────────────────────────────────────────
function BoardingPassCard({ view, setView }) {
  return (
    <div
      className="w-full flex rounded-2xl overflow-hidden"
      style={{
        maxWidth: 780,
        background: "#FFFFFF",
        boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 50px rgba(0,0,0,0.10)",
      }}
    >
      <div className="flex-1 px-10 py-10">
        <BrandMark />
        {view === "login"
          ? <LoginForm setView={setView} />
          : <RegisterForm setView={setView} />
        }
      </div>
      <StubPanel />
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────
function LoginForm({ setView }) {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}>
        Welcome back.
      </h1>
      <p className="text-sm mb-7" style={{ color: "#8FA3B1" }}>
        Sign in to see what's moved since your last check-in.
      </p>

      <TabSwitch active="login" setView={setView} />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="Email" id="email">
          <Input id="email" type="email" placeholder="you@example.com"
            value={form.email} onChange={set("email")} required />
        </Field>
        <Field label="Password" id="password">
          <Input id="password" type="password" placeholder="••••••••••"
            value={form.password} onChange={set("password")} required />
        </Field>

        <div className="flex justify-end -mt-1">
          <button type="button" onClick={() => setView("forgot")}
            className="text-xs font-semibold" style={{ color: "#F2A93B", background: "none", border: "none", cursor: "pointer" }}>
            Forgot password?
          </button>
        </div>

        <ErrorBanner message={error} />
        <PrimaryBtn type="submit" loading={loading}>Log in</PrimaryBtn>
      </form>

      <Divider />
      <GoogleBtn />
    </>
  );
}

// ── Register form ─────────────────────────────────────────────────────────
function RegisterForm({ setView }) {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]   = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}>
        Set up your watch.
      </h1>
      <p className="text-sm mb-7" style={{ color: "#8FA3B1" }}>
        One account, every route you care about, all in one place.
      </p>

      <TabSwitch active="register" setView={setView} />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" id="fname">
            <Input id="fname" type="text" placeholder="Riyas"
              value={form.firstName} onChange={set("firstName")} required />
          </Field>
          <Field label="Last name" id="lname">
            <Input id="lname" type="text" placeholder="Mohamed"
              value={form.lastName} onChange={set("lastName")} />
          </Field>
        </div>
        <Field label="Email" id="remail">
          <Input id="remail" type="email" placeholder="you@example.com"
            value={form.email} onChange={set("email")} required />
        </Field>
        <Field label="Password" id="rpw">
          <Input id="rpw" type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number"
            value={form.password} onChange={set("password")} required />
        </Field>

        <ErrorBanner message={error} />
        <PrimaryBtn type="submit" loading={loading}>Create account</PrimaryBtn>
      </form>

      <Divider />
      <GoogleBtn />
    </>
  );
}

// ── Forgot password card ──────────────────────────────────────────────────
function ForgotCard({ view, setView }) {
  const [email, setEmail]   = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setView("forgot-sent");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full rounded-2xl px-10 py-10"
      style={{
        maxWidth: 460,
        background: "#FFFFFF",
        boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 50px rgba(0,0,0,0.10)",
      }}
    >
      <BrandMark />

      {view === "forgot-sent" ? (
        <>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5"
            style={{ background: "rgba(79,174,132,0.1)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4FAE84" strokeWidth="2.2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}>
            Check your inbox.
          </h1>
          <p className="text-sm mb-7" style={{ color: "#8FA3B1" }}>
            We sent a reset link to <strong style={{ color: "#0E1F33" }}>{email}</strong>. It expires in 15 minutes.
          </p>
          <button onClick={() => setView("login")}
            className="text-sm font-semibold" style={{ color: "#F2A93B", background: "none", border: "none", cursor: "pointer" }}>
            ← Back to sign in
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}>
            Reset password.
          </h1>
          <p className="text-sm mb-7" style={{ color: "#8FA3B1" }}>
            Enter your email and we'll send a reset link.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Email" id="femail">
              <Input id="femail" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <ErrorBanner message={error} />
            <PrimaryBtn type="submit" loading={loading}>Send reset link</PrimaryBtn>
          </form>
          <button onClick={() => setView("login")} className="mt-5 text-sm font-semibold flex items-center gap-1"
            style={{ color: "#8FA3B1", background: "none", border: "none", cursor: "pointer" }}>
            ← Back to sign in
          </button>
        </>
      )}
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────
function BrandMark() {
  return (
    <div className="flex items-center gap-2 mb-8">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: "#4FAE84", boxShadow: "0 0 0 3px rgba(79,174,132,0.2)" }} />
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8FA3B1" }}>
        Fare&nbsp;Watch // Deal Monitoring Agent
      </span>
    </div>
  );
}

function TabSwitch({ active, setView }) {
  return (
    <div className="inline-flex rounded-full p-1" style={{ background: "rgba(14,31,51,0.06)" }}>
      {[["login", "Log in"], ["register", "Create account"]].map(([key, label]) => (
        <button key={key} onClick={() => setView(key)}
          className="rounded-full text-xs font-semibold px-5 py-2 transition-all"
          style={{
            background: active === key ? "#F2A93B" : "transparent",
            color: active === key ? "#23150A" : "#8FA3B1",
            border: "none", cursor: "pointer",
            fontFamily: "'Work Sans', sans-serif",
          }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: "#E5E0D8" }} />
      <span className="text-xs" style={{ color: "#8FA3B1" }}>or continue with</span>
      <div className="flex-1 h-px" style={{ background: "#E5E0D8" }} />
    </div>
  );
}

function GoogleBtn() {
  const handleGoogleAuth = () => {
    // Redirect to backend — passport takes over from here
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleAuth}
      className="w-full flex items-center justify-center gap-2.5 rounded-lg py-3 text-sm font-semibold transition-all"
      style={{ background: "#FFFFFF", border: "1.5px solid #E5E0D8", color: "#0E1F33", cursor: "pointer", fontFamily: "'Work Sans', sans-serif" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(14,31,51,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.1 12 2.1 6.9 2.1 2.7 6.3 2.7 12s4.2 9.9 9.3 9.9c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.1-1.6H12z" />
      </svg>
      Continue with Google
    </button>
  );
}

function StubPanel() {
  return (
    <div className="relative flex flex-col justify-between px-6 py-10"
      style={{ width: 200, background: "#F0EDE7", flexShrink: 0 }}>
      <div className="absolute top-0 bottom-0 left-0"
        style={{ borderLeft: "2px dashed rgba(14,31,51,0.12)", pointerEvents: "none" }} />
      <div className="absolute rounded-full" style={{ width: 22, height: 22, background: "#F5F3EF", top: -11, left: -11 }} />
      <div className="absolute rounded-full" style={{ width: 22, height: 22, background: "#F5F3EF", bottom: -11, left: -11 }} />
      <div>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8FA3B1", marginBottom: 14 }}>Boarding</p>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, color: "#0E1F33" }}>
          MAA<span style={{ color: "#F2A93B", margin: "0 6px", fontWeight: 400 }}>→</span>DXB
        </p>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8FA3B1", marginTop: 8 }}>Watching since setup</p>
      </div>
      <div>
        <div className="rounded mb-2.5" style={{ height: 46, background: "repeating-linear-gradient(90deg, #0E1F33 0px, #0E1F33 2px, transparent 2px, transparent 5px)", opacity: 0.18 }} />
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8FA3B1" }}>Agent&nbsp;ID · FDA‑0417</p>
      </div>
    </div>
  );
}