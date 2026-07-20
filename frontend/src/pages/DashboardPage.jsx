import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useRoutes } from "../hooks/useRoutes.js";
import { useAlerts } from "../hooks/useAlerts.js";
import { usePriceHistory } from "../hooks/usePriceHistory.js";
import RouteModal from "../components/routes/RouteModal.jsx";
import PriceChart from "../components/routes/PriceChart.jsx";
import {
  Spinner, StatusPill, PriceFlap, IconBtn,
  EmptyState, ErrorBanner,
} from "../components/ui/index.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const { routes, loading, error, createRoute, updateRoute, deleteRoute } = useRoutes();
  const { alerts, loading: alertsLoading } = useAlerts(10);
  const priceHistory = usePriceHistory();

  const [modalOpen, setModalOpen]     = useState(false);
  const [editRoute, setEditRoute]     = useState(null);
  const [deletingId, setDeletingId]   = useState(null);
  const [expandedId, setExpandedId]   = useState(null); // chart panel open

  const openAdd    = () => { setEditRoute(null); setModalOpen(true); };
  const openEdit   = (route) => { setEditRoute(route); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditRoute(null); };

  const handleSave = async (payload) => {
    if (editRoute) {
      await updateRoute(editRoute._id, {
        targetPrice: payload.targetPrice,
        alertThresholdPct: payload.alertThresholdPct,
      });
    } else {
      await createRoute(payload);
    }
  };

  const handlePause = async (route) => {
    const next = route.status === "active" ? "paused" : "active";
    await updateRoute(route._id, { status: next });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this route? This cannot be undone.")) return;
    setDeletingId(id);
    try { await deleteRoute(id); }
    finally { setDeletingId(null); }
  };

  const handleToggleChart = (routeId) => {
    if (expandedId === routeId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(routeId);
    // Fetch only if we don't already have data
    if (!priceHistory.getHistory(routeId).length) {
      priceHistory.fetchHistory(routeId, 30);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif" }}>
      {/* ── Top bar ── */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: "#0E1F33", margin: 0 }}>
            {greeting()}, {user?.firstName}.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8FA3B1" }}>
            {routes.length} route{routes.length !== 1 ? "s" : ""} being monitored
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "#F2A93B", color: "#23150A", border: "none", cursor: "pointer", fontFamily: "'Work Sans', sans-serif" }}
        >
          <span style={{ fontSize: 16 }}>+</span> Add route
        </button>
      </div>

      <ErrorBanner message={error} />

      {/* ── Routes board ── */}
      <div className="rounded-xl overflow-hidden mb-6"
        style={{ background: "#FFFFFF", border: "1px solid #EAE6E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

        {/* Table header */}
        <div className="grid px-5 py-3.5"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 1fr 130px",
            borderBottom: "1px solid #EAE6E0",
            fontFamily: "'Space Mono', monospace",
            fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#8FA3B1",
          }}>
          <div>Route</div>
          <div>Target</div>
          <div>Last price</div>
          <div>Status</div>
          <div />
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : routes.length === 0 ? (
          <EmptyState
            icon="✈️"
            title="No routes yet"
            sub="Add your first route to start monitoring deals."
            action={
              <button onClick={openAdd}
                className="mt-2 text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: "#F2A93B", color: "#23150A", border: "none", cursor: "pointer" }}>
                + Add route
              </button>
            }
          />
        ) : (
          routes.map((route) => (
            <div key={route._id}>
              <RouteRow
                route={route}
                deleting={deletingId === route._id}
                chartOpen={expandedId === route._id}
                onEdit={() => openEdit(route)}
                onPause={() => handlePause(route)}
                onDelete={() => handleDelete(route._id)}
                onToggleChart={() => handleToggleChart(route._id)}
              />
              {/* ── Inline chart panel ── */}
              {expandedId === route._id && (
                <div
                  className="px-5 py-5"
                  style={{ borderBottom: "1px solid #EAE6E0", background: "#FDFCFA" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10, letterSpacing: "0.14em",
                      textTransform: "uppercase", color: "#8FA3B1",
                    }}>
                      Price history · {route.origin} → {route.destination}
                    </span>
                    <button
                      onClick={() => priceHistory.fetchHistory(route._id, 30)}
                      className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
                      style={{ background: "#F0EDE7", border: "none", color: "#5C7589", cursor: "pointer" }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="23 4 23 10 17 10"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                      Refresh
                    </button>
                  </div>
                  <PriceChart
                    route={route}
                    history={priceHistory.getHistory(route._id)}
                    loading={priceHistory.isLoading(route._id)}
                    error={priceHistory.getError(route._id)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Alert log ── */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid #EAE6E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #EAE6E0" }}>
          <h3 style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8FA3B1", margin: 0 }}>
            Recent alerts
          </h3>
        </div>

        {alertsLoading ? (
          <div className="flex justify-center py-8"><Spinner size={24} /></div>
        ) : alerts.length === 0 ? (
          <EmptyState icon="🔔" title="No alerts yet" sub="Deal alerts will appear here once the agent finds a match." />
        ) : (
          <div className="divide-y" style={{ borderColor: "#EAE6E0" }}>
            {alerts.map((alert) => (
              <AlertRow key={alert._id} alert={alert} />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <RouteModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editRoute={editRoute}
      />
    </div>
  );
}

// ── Route row ─────────────────────────────────────────────────────────────
function RouteRow({ route, onEdit, onPause, onDelete, onToggleChart, deleting, chartOpen }) {
  const isPaused = route.status === "paused";
  const isDeal = route.baselinePrice &&
    route.baselinePrice > 0 &&
    route.lastPrice < route.baselinePrice * 0.8;

  const dateLabel = () => {
    const from  = route.departureDateFrom
      ? new Date(route.departureDateFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      : "";
    const to    = route.departureDateTo
      ? ` – ${new Date(route.departureDateTo).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`
      : "";
    const cabin = route.cabinClass?.replace("_", " ") ?? "";
    return `${from}${to} · ${route.tripType === "round_trip" ? "Round trip" : "One-way"} · ${cabin} · ${route.passengers} pax`;
  };

  return (
    <div
      className="grid items-center px-5 py-4 transition-colors"
      style={{
        gridTemplateColumns: "2fr 1fr 1fr 1fr 130px",
        borderBottom: chartOpen ? "none" : "1px solid #EAE6E0",
        opacity: isPaused ? 0.6 : 1,
        background: chartOpen ? "#FDFCFA" : "transparent",
      }}
      onMouseEnter={(e) => { if (!chartOpen) e.currentTarget.style.background = "#FDFCFA"; }}
      onMouseLeave={(e) => { if (!chartOpen) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Route */}
      <div className="flex flex-col gap-0.5">
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, color: "#0E1F33" }}>
          {route.origin}
          <span style={{ color: "#F2A93B", margin: "0 6px", fontWeight: 400 }}>→</span>
          {route.destination}
        </div>
        <div className="text-xs" style={{ color: "#8FA3B1" }}>{dateLabel()}</div>
      </div>

      {/* Target */}
      <div className="text-sm" style={{ fontFamily: "'Space Mono', monospace", color: "#5C7589" }}>
        {route.targetPrice
          ? `₹${route.targetPrice.toLocaleString("en-IN")}`
          : `≥${route.alertThresholdPct}% drop`}
      </div>

      {/* Last price */}
      <div>
        {route.baselinePrice
          ? <PriceFlap price={route.baselinePrice} isDeal={isDeal} />
          : <span className="text-xs" style={{ color: "#8FA3B1" }}>Not checked yet</span>
        }
      </div>

      {/* Status */}
      <div><StatusPill status={route.status} /></div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Chart toggle */}
        <IconBtn
          title={chartOpen ? "Hide chart" : "Show price history"}
          onClick={onToggleChart}
          style={chartOpen ? { background: "rgba(242,169,59,0.12)", color: "#B87C1A" } : {}}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </IconBtn>

        {/* Edit */}
        <IconBtn title="Edit" onClick={onEdit}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </IconBtn>

        {/* Pause/Resume */}
        <IconBtn title={isPaused ? "Resume" : "Pause"} onClick={onPause}>
          {isPaused
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          }
        </IconBtn>

        {/* Delete */}
        <IconBtn title="Delete" onClick={onDelete}>
          {deleting
            ? <Spinner size={14} />
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          }
        </IconBtn>
      </div>
    </div>
  );
}

// ── Alert row ─────────────────────────────────────────────────────────────
function AlertRow({ alert }) {
  const isSent   = alert.status === "sent";
  const isFailed = alert.status === "failed";
  const route    = alert.routeId;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const h = Math.floor(diff / 36e5);
    const d = Math.floor(diff / 864e5);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return "just now";
  };

  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className="w-1.5 rounded-full flex-shrink-0 mt-1.5"
        style={{ height: 28, background: isSent ? "#4FAE84" : isFailed ? "#E2604F" : "#8FA3B1" }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ fontFamily: "'Space Mono', monospace", color: "#0E1F33" }}>
          {route?.origin ?? "?"} → {route?.destination ?? "?"} · ₹{alert.priceAtAlert?.toLocaleString("en-IN")}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "#8FA3B1" }}>
          {alert.dropPct ? `${alert.dropPct.toFixed(1)}% below baseline` : "Target price reached"} ·{" "}
          {alert.channel} · {timeAgo(alert.sentAt || alert.createdAt)}
        </div>
      </div>
      <StatusPill status={alert.status} />
    </div>
  );
}