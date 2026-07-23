// ── Field ─────────────────────────────────────────────────────────────────
export const Field = ({ label, id, error, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-xs font-medium" style={{ color: "#8FA3B1" }}>
        {label}
      </label>
    )}
    {children}
    {error && <p className="text-xs font-medium" style={{ color: "#E2604F" }}>{error}</p>}
  </div>
);

// ── Input ─────────────────────────────────────────────────────────────────
export const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full rounded-lg px-3.5 py-2.5 text-sm transition-all outline-none
      border focus:border-amber-400 focus:bg-white ${className}`}
    style={{
      background: "#F7F5F1",
      border: "1.5px solid #E5E0D8",
      color: "#0E1F33",
      fontFamily: "'Work Sans', sans-serif",
    }}
    onFocus={(e) => {
      e.target.style.borderColor = "#F2A93B";
      e.target.style.background = "#FFFFFF";
    }}
    onBlur={(e) => {
      e.target.style.borderColor = "#E5E0D8";
      e.target.style.background = "#F7F5F1";
    }}
    {...props}
  />
);

// ── Select ────────────────────────────────────────────────────────────────
export const Select = ({ children, className = "", ...props }) => (
  <select
    className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none cursor-pointer ${className}`}
    style={{
      background: "#F7F5F1",
      border: "1.5px solid #E5E0D8",
      color: "#0E1F33",
      fontFamily: "'Work Sans', sans-serif",
    }}
    onFocus={(e) => (e.target.style.borderColor = "#F2A93B")}
    onBlur={(e)  => (e.target.style.borderColor = "#E5E0D8")}
    {...props}
  >
    {children}
  </select>
);

// ── Button variants ───────────────────────────────────────────────────────
export const PrimaryBtn = ({ children, loading, disabled, className = "", ...props }) => (
  <button
    className={`w-full rounded-lg py-3 text-sm font-bold transition-opacity ${className}`}
    style={{
      background: "#F2A93B",
      color: "#23150A",
      border: "none",
      fontFamily: "'Work Sans', sans-serif",
      opacity: loading || disabled ? 0.6 : 1,
      cursor: loading || disabled ? "not-allowed" : "pointer",
    }}
    disabled={loading || disabled}
    {...props}
  >
    {loading ? "Please wait…" : children}
  </button>
);

export const GhostBtn = ({ children, className = "", ...props }) => (
  <button
    className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${className}`}
    style={{
      background: "transparent",
      border: "1.5px solid #E5E0D8",
      color: "#0E1F33",
      fontFamily: "'Work Sans', sans-serif",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(14,31,51,0.3)")}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E0D8")}
    {...props}
  >
    {children}
  </button>
);

export const IconBtn = ({ children, title, ...props }) => (
  <button
    title={title}
    className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
    style={{ background: "transparent", border: "none", color: "#8FA3B1", cursor: "pointer" }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "#F0EDE7";
      e.currentTarget.style.color = "#0E1F33";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "#8FA3B1";
    }}
    {...props}
  >
    {children}
  </button>
);

// ── Spinner ───────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20 }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F2A93B"
    strokeWidth="2.5"
    className="animate-spin"
  >
    <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// ── Status pill ───────────────────────────────────────────────────────────
const STATUS_STYLES = {
  active:  { bg: "rgba(79,174,132,0.12)",  color: "#2D8A63" },
  paused:  { bg: "rgba(143,163,177,0.15)", color: "#5C7589" },
  deleted: { bg: "rgba(226,96,79,0.10)",   color: "#C04030" },
  sent:    { bg: "rgba(79,174,132,0.12)",  color: "#2D8A63" },
  failed:  { bg: "rgba(226,96,79,0.10)",   color: "#C04030" },
  flagged: { bg: "rgba(242,169,59,0.12)",  color: "#B87C1A" },
};

export const StatusPill = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.paused;
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
      style={{
        background: style.bg,
        color: style.color,
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.08em",
      }}
    >
      {status}
    </span>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, sub, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <span className="text-4xl opacity-30">{icon}</span>
    <p className="font-semibold text-sm" style={{ color: "#0E1F33" }}>{title}</p>
    <p className="text-xs" style={{ color: "#8FA3B1" }}>{sub}</p>
    {action}
  </div>
);

// ── Price flap ────────────────────────────────────────────────────────────
export const PriceFlap = ({ price, currency = "INR", isDeal = false }) => (
  <span
    className="inline-block px-2.5 py-1 rounded"
    style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: 14,
      fontWeight: 700,
      background: isDeal ? "rgba(79,174,132,0.10)" : "rgba(242,169,59,0.08)",
      color: isDeal ? "#2D8A63" : "#B87C1A",
    }}
  >
    {currency === "INR" ? "₹" : currency}{" "}
    {price?.toLocaleString("en-IN") ?? "—"}
  </span>
);

// ── Error banner ──────────────────────────────────────────────────────────
export const ErrorBanner = ({ message }) =>
  message ? (
    <div
      className="rounded-lg px-4 py-3 text-sm font-medium mb-4"
      style={{ background: "rgba(226,96,79,0.08)", color: "#C04030", border: "1px solid rgba(226,96,79,0.2)" }}
    >
      {message}
    </div>
  ) : null;

// ── Airport Autocomplete ──────────────────────────────────────────────────
export { AirportAutocomplete } from "./AirportAutocomplete.jsx";
