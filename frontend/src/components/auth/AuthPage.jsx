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
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••••"
              value={form.password} onChange={set("password")} required />
            <PasswordToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} />
          </div>
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
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          <div className="relative">
            <Input id="rpw" type={showPassword ? "text" : "password"} placeholder="Min. 8 chars"
              value={form.password} onChange={set("password")} required />
            <PasswordToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} />
          </div>
        </Field>

        <ErrorBanner message={error} />
        <PrimaryBtn type="submit" loading={loading}>Create account</PrimaryBtn>
      </form>

      <Divider />
      <GoogleBtn />
    </>
  );
}

// ── Password Visibility Toggle Helper ──────────────────────────────────────
function PasswordToggle({ show, toggle }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2"
      style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA3B1" }}
    >
      {show ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      )}
    </button>
  );
}

// ── Forgot password card ──────────────────────────────────────────────────
function ForgotCard({ view, setView }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
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
  return (
    <button
      className="w-full flex items-center justify-center gap-2.5 rounded-lg py-3 text-sm font-semibold transition-all"
      style={{ background: "#FFFFFF", border: "1.5px solid #E5E0D8", color: "#0E1F33", cursor: "pointer", fontFamily: "'Work Sans', sans-serif" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(14,31,51,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.95 2.36 30.41 0 24 0 14.64 0 6.56 5.38 2.62 13.22l8.04 6.24C12.56 13.68 17.82 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.55c0-1.64-.15-3.21-.42-4.73H24v9h12.68c-.55 2.96-2.22 5.46-4.73 7.14l7.63 5.92C44.02 37.83 46.5 31.73 46.5 24.55z"/>
        <path fill="#FBBC05" d="M10.66 28.54A14.47 14.47 0 0 1 9.5 24c0-1.58.27-3.1.75-4.54l-8.04-6.24A23.96 23.96 0 0 0 0 24c0 3.87.93 7.53 2.21 10.78l8.45-6.24z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.63-5.92c-2.12 1.42-4.83 2.27-8.26 2.27-6.18 0-11.44-4.18-13.34-9.96l-8.45 6.24C6.56 42.62 14.64 48 24 48z"/>
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