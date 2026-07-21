import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useUser } from "../../hooks/useUser.js";
import { Field, Input, PrimaryBtn, GhostBtn, ErrorBanner } from "../ui/index.jsx";

export default function ProfilePanel({ open, onClose }) {
  const { user } = useAuth();
  const { loading, error, success, clearMessages, updateProfile, connectTelegram, disconnectTelegram } = useUser();
  const panelRef = useRef(null);

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "telegram"

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) { clearMessages(); setActiveTab("profile"); }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(14,31,51,0.18)" }} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed left-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: 320,
          background: "#FFFFFF",
          boxShadow: "4px 0 24px rgba(0,0,0,0.10)",
          fontFamily: "'Work Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid #EAE6E0" }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8FA3B1" }}>
              My profile
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-base"
              style={{ background: "#F0EDE7", border: "none", color: "#8FA3B1", cursor: "pointer" }}
            >
              ×
            </button>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: "#F2A93B", color: "#23150A", fontFamily: "'Space Mono', monospace" }}
            >
              {`${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="font-semibold text-sm" style={{ color: "#0E1F33" }}>
                  {user?.firstName} {user?.lastName}
                </div>
                {user?.authProvider === "google" && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ background: "rgba(234,67,53,0.08)", color: "#EA4335", fontSize: 10 }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.1 12 2.1 6.9 2.1 2.7 6.3 2.7 12s4.2 9.9 9.3 9.9c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.1-1.6H12z"/>
                    </svg>
                    Google
                  </span>
                )}
              </div>
              <div className="text-xs" style={{ color: "#8FA3B1" }}>{user?.email}</div>
              <div className="text-xs mt-0.5" style={{ color: user?.telegramChatId ? "#2D8A63" : "#8FA3B1" }}>
                {user?.telegramChatId ? "✓ Telegram connected" : "Telegram not connected"}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {[["profile", "Profile"], ["telegram", "Telegram"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); clearMessages(); }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeTab === key ? "rgba(242,169,59,0.12)" : "transparent",
                  color: activeTab === key ? "#B87C1A" : "#8FA3B1",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Work Sans', sans-serif",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error   && <ErrorBanner message={error} />}
          {success && (
            <div className="rounded-lg px-4 py-3 text-sm font-medium mb-4"
              style={{ background: "rgba(79,174,132,0.08)", color: "#2D8A63", border: "1px solid rgba(79,174,132,0.2)" }}>
              {success}
            </div>
          )}

          {activeTab === "profile"
            ? <ProfileTab user={user} loading={loading} onSave={updateProfile} />
            : <TelegramTab user={user} loading={loading} onConnect={connectTelegram} onDisconnect={disconnectTelegram} />
          }
        </div>

        {/* Info footer */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid #EAE6E0" }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4FAE84" }} />
            <span className="text-xs" style={{ color: "#8FA3B1" }}>
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Profile tab ────────────────────────────────────────────────────────────
function ProfileTab({ user, loading, onSave }) {
  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" });
  }, [user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <Section title="Personal info" />
      <Field label="First name" id="pfname">
        <Input id="pfname" value={form.firstName} onChange={set("firstName")} required />
      </Field>
      <Field label="Last name" id="plname">
        <Input id="plname" value={form.lastName} onChange={set("lastName")} />
      </Field>
      <Field label="Email" id="pemail">
        <Input id="pemail" value={user?.email ?? ""} disabled
          style={{ opacity: 0.5, cursor: "not-allowed" }} />
      </Field>
      <p className="text-xs" style={{ color: "#8FA3B1" }}>Email cannot be changed after registration.</p>

      <div className="flex justify-end pt-2">
        <PrimaryBtn type="submit" loading={saving} className="w-auto px-5">
          Save changes
        </PrimaryBtn>
      </div>
    </form>
  );
}

// ── Telegram tab ───────────────────────────────────────────────────────────
function TelegramTab({ user, loading, onConnect, onDisconnect }) {
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const isConnected = !!user?.telegramChatId;

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!chatId.trim()) return;
    setSaving(true);
    try { await onConnect(chatId.trim()); setChatId(""); }
    finally { setSaving(false); }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Telegram? You won't receive deal alerts until you reconnect.")) return;
    setSaving(true);
    try { await onDisconnect(); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <Section title="Telegram channel" />

      {/* How-to steps */}
      <div className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: "#F7F5F1", border: "1px solid #EAE6E0" }}>
        <p className="text-xs font-semibold" style={{ color: "#0E1F33" }}>How to get your Chat ID:</p>
        {[
          ["1", "Open Telegram and search for @userinfobot"],
          ["2", 'Start the bot and send /start — it replies with your Chat ID'],
          ["3", "Paste the numeric ID below"],
        ].map(([n, text]) => (
          <div key={n} className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "#F2A93B", color: "#23150A", fontFamily: "'Space Mono', monospace" }}>
              {n}
            </span>
            <span className="text-xs" style={{ color: "#5C7589" }}>{text}</span>
          </div>
        ))}
      </div>

      {isConnected ? (
        /* Connected state */
        <div className="flex flex-col gap-3">
          <div className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: "rgba(79,174,132,0.06)", border: "1px solid rgba(79,174,132,0.2)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(79,174,132,0.15)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4FAE84" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#2D8A63" }}>Connected</div>
              <div className="text-xs" style={{ color: "#8FA3B1" }}>Chat ID: {user.telegramChatId}</div>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "rgba(226,96,79,0.07)", border: "1.5px solid rgba(226,96,79,0.2)", color: "#C04030", cursor: "pointer" }}
          >
            {saving ? "Disconnecting…" : "Disconnect Telegram"}
          </button>
        </div>
      ) : (
        /* Connect form */
        <form onSubmit={handleConnect} className="flex flex-col gap-3">
          <Field label="Your Telegram Chat ID" id="tchatid">
            <Input id="tchatid" placeholder="e.g. 123456789" value={chatId}
              onChange={(e) => setChatId(e.target.value)} required />
          </Field>
          <PrimaryBtn type="submit" loading={saving}>
            Connect Telegram
          </PrimaryBtn>
        </form>
      )}
    </div>
  );
}

function Section({ title }) {
  return (
    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8FA3B1", margin: 0 }}>
      {title}
    </p>
  );
}