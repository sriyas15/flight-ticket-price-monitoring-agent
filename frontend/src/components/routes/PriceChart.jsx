import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Spinner } from "../ui/index.jsx";

// ── Custom tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  const price = payload[0]?.value;
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-xs"
      style={{
        background: "#FFFFFF",
        border: "1px solid #EAE6E0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        fontFamily: "'Work Sans', sans-serif",
      }}
    >
      <div style={{ color: "#8FA3B1", marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "#0E1F33", fontSize: 13 }}>
        {currency === "INR" ? "₹" : currency}{" "}
        {price?.toLocaleString("en-IN")}
      </div>
    </div>
  );
};

// ── Main chart ─────────────────────────────────────────────────────────────
export default function PriceChart({ history = [], loading, error, route }) {
  const currency = route?.currency ?? "INR";
  const symbol   = currency === "INR" ? "₹" : currency;

  // Shape data for recharts
  const data = history.map((obs) => ({
    date:  _formatDate(obs.observedAt),
    price: obs.price,
    full:  obs.observedAt,
  }));

  // Derive stats
  const prices      = data.map((d) => d.price).filter(Boolean);
  const minPrice    = prices.length ? Math.min(...prices) : null;
  const maxPrice    = prices.length ? Math.max(...prices) : null;
  const latestPrice = prices.at(-1) ?? null;
  const baseline    = route?.baselinePrice ?? null;
  const targetPrice = route?.targetPrice   ?? null;

  // Y-axis domain with breathing room
  const yMin = minPrice ? Math.floor(minPrice * 0.92 / 500) * 500 : 0;
  const yMax = maxPrice ? Math.ceil(maxPrice  * 1.06 / 500) * 500 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs py-6 text-center" style={{ color: "#E2604F" }}>
        {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="text-xs py-8 text-center" style={{ color: "#8FA3B1" }}>
        No price data yet — the agent needs to run at least once for this route.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif" }}>
      {/* ── Stat pills ── */}
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { label: "Latest",   value: latestPrice, highlight: false },
          { label: "Lowest",   value: minPrice,    highlight: true  },
          { label: "Highest",  value: maxPrice,    highlight: false },
          { label: "Baseline", value: baseline,    highlight: false },
          ...(targetPrice ? [{ label: "Target", value: targetPrice, highlight: false }] : []),
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className="flex flex-col rounded-lg px-3 py-2"
            style={{
              background: highlight ? "rgba(79,174,132,0.08)" : "#F7F5F1",
              border: `1px solid ${highlight ? "rgba(79,174,132,0.2)" : "#EAE6E0"}`,
              minWidth: 80,
            }}
          >
            <span className="text-xs" style={{ color: "#8FA3B1", marginBottom: 2 }}>{label}</span>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 13,
                fontWeight: 700,
                color: highlight ? "#2D8A63" : "#0E1F33",
              }}
            >
              {value != null ? `${symbol}${value.toLocaleString("en-IN")}` : "—"}
            </span>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${route?._id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#F2A93B" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#F2A93B" stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#EAE6E0"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#8FA3B1", fontFamily: "'Space Mono', monospace" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: "#8FA3B1", fontFamily: "'Space Mono', monospace" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />

          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ stroke: "#F2A93B", strokeWidth: 1, strokeDasharray: "4 2" }}
          />

          {/* Baseline reference line */}
          {baseline && (
            <ReferenceLine
              y={baseline}
              stroke="#8FA3B1"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{
                value: "Baseline",
                position: "insideTopRight",
                fontSize: 9,
                fill: "#8FA3B1",
                fontFamily: "'Space Mono', monospace",
              }}
            />
          )}

          {/* Target price reference line */}
          {targetPrice && (
            <ReferenceLine
              y={targetPrice}
              stroke="#4FAE84"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{
                value: "Target",
                position: "insideTopRight",
                fontSize: 9,
                fill: "#4FAE84",
                fontFamily: "'Space Mono', monospace",
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="price"
            stroke="#F2A93B"
            strokeWidth={2}
            fill={`url(#grad-${route?._id})`}
            dot={data.length <= 10
              ? { r: 3, fill: "#F2A93B", strokeWidth: 0 }
              : false
            }
            activeDot={{ r: 5, fill: "#F2A93B", strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs mt-2" style={{ color: "#8FA3B1" }}>
        Showing last {data.length} observation{data.length !== 1 ? "s" : ""} · prices from Travelpayouts cache
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
const _formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};