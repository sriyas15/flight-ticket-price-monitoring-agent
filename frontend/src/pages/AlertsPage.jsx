import { useAlerts } from "../hooks/useAlerts.js";
import { Spinner, StatusPill, EmptyState, ErrorBanner } from "../components/ui/index.jsx";

export default function AlertsPage() {
  const { alerts, loading, error, refetch } = useAlerts(50);

  const timeAgo = (date) => {
    if (!date) return "—";
    const diff = Date.now() - new Date(date);
    const h = Math.floor(diff / 36e5);
    const d = Math.floor(diff / 864e5);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return "just now";
  };

  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: "#0E1F33", margin: 0 }}>
            Alert log
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8FA3B1" }}>
            Every deal alert the agent has fired for your routes.
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          style={{ background: "#F0EDE7", border: "none", color: "#5C7589", cursor: "pointer" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      <ErrorBanner message={error} />

      <div className="rounded-xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #EAE6E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

        {/* Table header */}
        <div className="grid px-5 py-3.5"
          style={{
            gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 0.8fr 0.8fr",
            borderBottom: "1px solid #EAE6E0",
            fontFamily: "'Space Mono', monospace",
            fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#8FA3B1",
          }}>
          <div>Route</div>
          <div>Price at alert</div>
          <div>Drop</div>
          <div>Channel</div>
          <div>Status</div>
          <div>When</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : alerts.length === 0 ? (
          <EmptyState icon="🔔" title="No alerts yet"
            sub="Deal alerts will appear here once the monitoring agent finds a price drop." />
        ) : (
          alerts.map((alert) => {
            const route = alert.routeId;
            return (
              <div
                key={alert._id}
                className="grid items-center px-5 py-4 transition-colors"
                style={{
                  gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr 0.8fr 0.8fr",
                  borderBottom: "1px solid #EAE6E0",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FDFCFA")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 14, color: "#0E1F33" }}>
                  {route?.origin ?? "?"}<span style={{ color: "#F2A93B", margin: "0 5px" }}>→</span>{route?.destination ?? "?"}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: "#0E1F33" }}>
                  ₹{alert.priceAtAlert?.toLocaleString("en-IN")}
                </div>
                <div className="text-sm" style={{ color: alert.dropPct ? "#2D8A63" : "#8FA3B1" }}>
                  {alert.dropPct ? `−${alert.dropPct.toFixed(1)}%` : "Target hit"}
                </div>
                <div className="text-sm capitalize" style={{ color: "#5C7589" }}>{alert.channel}</div>
                <div><StatusPill status={alert.status} /></div>
                <div className="text-xs" style={{ color: "#8FA3B1" }}>
                  {timeAgo(alert.sentAt || alert.createdAt)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
