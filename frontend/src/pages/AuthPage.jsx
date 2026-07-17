import { useState } from "react";

// ── Fonts loaded via index.html or a global CSS import:
// <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

export default function AuthPage({ onAuthSuccess }) {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [showForgot, setShowForgot] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          "radial-gradient(circle at 20% 15%, rgba(242,169,59,0.08), transparent 40%), radial-gradient(circle at 85% 80%, rgba(79,174,132,0.06), transparent 45%), #F5F3EF",
        fontFamily: "'Work Sans', sans-serif",
      }}
    >
      {showForgot ? (
        <ForgotPassword onBack={() => setShowForgot(false)} />
      ) : (
        <BoardingPassCard
          tab={tab}
          setTab={setTab}
          onForgot={() => setShowForgot(true)}
          onAuthSuccess={onAuthSuccess}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BOARDING PASS CARD
═══════════════════════════════════════════════ */
function BoardingPassCard({ tab, setTab, onForgot, onAuthSuccess }) {
  return (
    <div
      className="w-full flex rounded-2xl overflow-hidden"
      style={{
        maxWidth: 780,
        background: "#FFFFFF",
        boxShadow:
          "0 4px 6px rgba(0,0,0,0.04), 0 20px 50px rgba(0,0,0,0.10)",
      }}
    >
      {/* ── MAIN FORM AREA ── */}
      <div className="flex-1 px-10 py-10">
        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-8">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: "#4FAE84",
              boxShadow: "0 0 0 3px rgba(79,174,132,0.2)",
            }}
          />
          <span
            className="text-xs tracking-widest uppercase"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: "#8FA3B1",
            }}
          >
            Fare&nbsp;Watch // Deal Monitoring Agent
          </span>
        </div>

        {/* Tab-switched form */}
        {tab === "login" ? (
          <LoginForm
            setTab={setTab}
            onForgot={onForgot}
            onAuthSuccess={onAuthSuccess}
          />
        ) : (
          <RegisterForm setTab={setTab} onAuthSuccess={onAuthSuccess} />
        )}
      </div>

      {/* ── STUB / TEAR-OFF PANEL ── */}
      <StubPanel />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LOGIN FORM
═══════════════════════════════════════════════ */
function LoginForm({ setTab, onForgot, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    // TODO: replace with real API call
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    onAuthSuccess?.();
  };

  return (
    <>
      <h1
        className="text-3xl font-bold mb-1 leading-snug"
        style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}
      >
        Welcome back.
      </h1>
      <p className="text-sm mb-7" style={{ color: "#8FA3B1" }}>
        Sign in to see what's moved since your last check-in.
      </p>

      <TabSwitch tab="login" setTab={setTab} />

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <Field
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          id="password"
          type="password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end -mt-1">
          <button
            type="button"
            onClick={onForgot}
            className="text-xs font-medium transition-colors"
            style={{ color: "#F2A93B", fontFamily: "'Work Sans', sans-serif" }}
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <p className="text-xs font-medium" style={{ color: "#E2604F" }}>
            {error}
          </p>
        )}

        <PrimaryButton type="submit" loading={loading}>
          Log in
        </PrimaryButton>
      </form>

      <Divider />
      <GoogleButton onAuthSuccess={onAuthSuccess} />
    </>
  );
}

/* ═══════════════════════════════════════════════
   REGISTER FORM
═══════════════════════════════════════════════ */
function RegisterForm({ setTab, onAuthSuccess }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    // TODO: replace with real API call
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    onAuthSuccess?.();
  };

  return (
    <>
      <h1
        className="text-3xl font-bold mb-1 leading-snug"
        style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}
      >
        Set up your watch.
      </h1>
      <p className="text-sm mb-7" style={{ color: "#8FA3B1" }}>
        One account, every route you care about, all in one place.
      </p>

      <TabSwitch tab="register" setTab={setTab} />

      <form onSubmit={handleRegister} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="First name"
            id="fname"
            type="text"
            placeholder="Riyas"
            value={form.firstName}
            onChange={set("firstName")}
          />
          <Field
            label="Last name"
            id="lname"
            type="text"
            placeholder="Mohamed"
            value={form.lastName}
            onChange={set("lastName")}
          />
        </div>
        <Field
          label="Email"
          id="remail"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
        />
        <Field
          label="Password"
          id="rpw"
          type="password"
          placeholder="Create a password (min. 8 chars)"
          value={form.password}
          onChange={set("password")}
        />

        {error && (
          <p className="text-xs font-medium" style={{ color: "#E2604F" }}>
            {error}
          </p>
        )}

        <PrimaryButton type="submit" loading={loading}>
          Create account
        </PrimaryButton>
      </form>

      <Divider />
      <GoogleButton onAuthSuccess={onAuthSuccess} />
    </>
  );
}

/* ═══════════════════════════════════════════════
   FORGOT PASSWORD
═══════════════════════════════════════════════ */
function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // TODO: replace with real API call
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <div
      className="w-full rounded-2xl px-10 py-10"
      style={{
        maxWidth: 460,
        background: "#FFFFFF",
        boxShadow:
          "0 4px 6px rgba(0,0,0,0.04), 0 20px 50px rgba(0,0,0,0.10)",
      }}
    >
      {/* Brand mark */}
      <div className="flex items-center gap-2 mb-8">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: "#4FAE84",
            boxShadow: "0 0 0 3px rgba(79,174,132,0.2)",
          }}
        />
        <span
          className="text-xs tracking-widest uppercase"
          style={{
            fontFamily: "'Space Mono', monospace",
            color: "#8FA3B1",
          }}
        >
          Fare&nbsp;Watch
        </span>
      </div>

      {sent ? (
        <>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-5"
            style={{ background: "rgba(79,174,132,0.1)" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4FAE84"
              strokeWidth="2.2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}
          >
            Check your inbox.
          </h1>
          <p className="text-sm mb-7" style={{ color: "#8FA3B1" }}>
            We've sent a reset link to{" "}
            <span className="font-semibold" style={{ color: "#0E1F33" }}>
              {email}
            </span>
            . It expires in 15 minutes.
          </p>
          <button
            onClick={onBack}
            className="text-sm font-semibold flex items-center gap-1 transition-colors"
            style={{ color: "#F2A93B" }}
          >
            ← Back to sign in
          </button>
        </>
      ) : (
        <>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}
          >
            Reset password.
          </h1>
          <p className="text-sm mb-7" style={{ color: "#8FA3B1" }}>
            Enter your email and we'll send a reset link.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Email"
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PrimaryButton type="submit" loading={loading}>
              Send reset link
            </PrimaryButton>
          </form>
          <button
            onClick={onBack}
            className="mt-5 text-sm font-semibold flex items-center gap-1"
            style={{ color: "#8FA3B1" }}
          >
            ← Back to sign in
          </button>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   STUB / TICKET TEAR-OFF PANEL
═══════════════════════════════════════════════ */
function StubPanel() {
  return (
    <div
      className="relative flex flex-col justify-between px-6 py-10"
      style={{ width: 200, background: "#F0EDE7", flexShrink: 0 }}
    >
      {/* Perforation line */}
      <div
        className="absolute top-0 bottom-0 left-0"
        style={{
          borderLeft: "2px dashed rgba(14,31,51,0.12)",
          pointerEvents: "none",
        }}
      />
      {/* Notches */}
      <div
        className="absolute rounded-full"
        style={{
          width: 22,
          height: 22,
          background: "#F5F3EF",
          top: -11,
          left: -11,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 22,
          height: 22,
          background: "#F5F3EF",
          bottom: -11,
          left: -11,
        }}
      />

      {/* Top: route */}
      <div>
        <p
          className="text-xs tracking-widest uppercase mb-3"
          style={{ fontFamily: "'Space Mono', monospace", color: "#8FA3B1" }}
        >
          Boarding
        </p>
        <p
          className="text-base font-bold"
          style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}
        >
          MAA
          <span style={{ color: "#F2A93B", margin: "0 6px", fontWeight: 400 }}>
            →
          </span>
          DXB
        </p>
        <p
          className="text-xs mt-1 tracking-wider uppercase"
          style={{ fontFamily: "'Space Mono', monospace", color: "#8FA3B1" }}
        >
          Watching since setup
        </p>
      </div>

      {/* Bottom: barcode */}
      <div>
        <div
          className="rounded"
          style={{
            height: 46,
            background:
              "repeating-linear-gradient(90deg, #0E1F33 0px, #0E1F33 2px, transparent 2px, transparent 5px)",
            opacity: 0.18,
            marginBottom: 10,
          }}
        />
        <p
          className="text-xs tracking-widest uppercase"
          style={{ fontFamily: "'Space Mono', monospace", color: "#8FA3B1" }}
        >
          Agent&nbsp;ID · FDA‑0417
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHARED UI PRIMITIVES
═══════════════════════════════════════════════ */
function TabSwitch({ tab, setTab }) {
  return (
    <div
      className="inline-flex rounded-full p-1"
      style={{ background: "rgba(14,31,51,0.06)" }}
    >
      {[
        { key: "login", label: "Log in" },
        { key: "register", label: "Create account" },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className="rounded-full text-xs font-semibold px-5 py-2 transition-all"
          style={{
            fontFamily: "'Work Sans', sans-serif",
            background: tab === key ? "#F2A93B" : "transparent",
            color: tab === key ? "#23150A" : "#8FA3B1",
            border: "none",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, id, type, placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium mb-1.5"
        style={{ color: "#8FA3B1" }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-lg px-3.5 py-3 text-sm transition-all"
        style={{
          fontFamily: "'Work Sans', sans-serif",
          background: focused ? "#FFFFFF" : "#F7F5F1",
          border: focused ? "1.5px solid #F2A93B" : "1.5px solid #E5E0D8",
          color: "#0E1F33",
          outline: "none",
        }}
      />
    </div>
  );
}

function PrimaryButton({ children, type = "button", loading, onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-lg py-3 text-sm font-bold transition-opacity mt-1"
      style={{
        fontFamily: "'Work Sans', sans-serif",
        background: "#F2A93B",
        color: "#23150A",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: "#E5E0D8" }} />
      <span className="text-xs" style={{ color: "#8FA3B1" }}>
        or continue with
      </span>
      <div className="flex-1 h-px" style={{ background: "#E5E0D8" }} />
    </div>
  );
}

function GoogleButton({ onAuthSuccess }) {
  return (
    <button
      onClick={onAuthSuccess}
      className="w-full flex items-center justify-center gap-2.5 rounded-lg py-3 text-sm font-semibold transition-all"
      style={{
        fontFamily: "'Work Sans', sans-serif",
        background: "#FFFFFF",
        border: "1.5px solid #E5E0D8",
        color: "#0E1F33",
        cursor: "pointer",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(14,31,51,0.3)")
      }
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
