import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import ProfilePanel from "./ProfilePanel.jsx";

const NAV = [
  {
    to: "/dashboard",
    label: "Routes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 12l7-2 4-8 2 1-3 7 7-1 3 3-8 2-2 7-2-1 1-6-7 1z" />
      </svg>
    ),
  },
  {
    to: "/alerts",
    label: "Alert log",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 01-3.4 0" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <>
      <aside
        className="flex flex-col h-screen sticky top-0 z-30"
        style={{
          width: 220,
          minWidth: 220,
          background: "#FFFFFF",
          borderRight: "1px solid #EAE6E0",
          fontFamily: "'Work Sans', sans-serif",
        }}
      >
        {/* ── Brand ── */}
        <div className="px-5 py-6 flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: "#4FAE84", boxShadow: "0 0 0 3px rgba(79,174,132,0.2)" }}
          />
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "#8FA3B1",
          }}>
            Fare Watch
          </span>
        </div>

        <div className="mx-4 mb-4" style={{ height: 1, background: "#EAE6E0" }} />

        {/* ── Nav links ── */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={({ isActive }) => ({
                background: isActive ? "rgba(242,169,59,0.10)" : "transparent",
                color: isActive ? "#B87C1A" : "#5C7589",
                textDecoration: "none",
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? "#F2A93B" : "#8FA3B1" }}>{icon}</span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── User card + Logout ── */}
        <div className="px-4 py-5 flex flex-col gap-2" style={{ borderTop: "1px solid #EAE6E0" }}>
          {/* Clickable profile row */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-lg transition-colors text-left"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F5F1")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            title="View profile"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: "#F2A93B", color: "#23150A", fontFamily: "'Space Mono', monospace" }}
            >
              {initials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate" style={{ color: "#0E1F33" }}>
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs truncate" style={{ color: "#8FA3B1" }}>
                {user?.email}
              </span>
            </div>
            {/* Telegram indicator dot */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              title={user?.telegramChatId ? "Telegram connected" : "Telegram not connected"}
              style={{ background: user?.telegramChatId ? "#4FAE84" : "#E5E0D8" }}
            />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium w-full transition-colors"
            style={{ background: "transparent", border: "none", color: "#8FA3B1", cursor: "pointer" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#FFF0F0";
              e.currentTarget.style.color = "#C04030";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#8FA3B1";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* Profile slide-over */}
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
