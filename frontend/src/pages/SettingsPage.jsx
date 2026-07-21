import { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser.js";
import { Field, Input, PrimaryBtn, ErrorBanner } from "../components/ui/index.jsx";

export default function SettingsPage() {
  const {
    user, error, success, clearMessages,
    updateProfile, connectTelegram, disconnectTelegram,
    changePassword, deleteAccount,
  } = useUser();

  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif", maxWidth: 640 }}>
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: "#0E1F33", margin: "0 0 4px 0" }}>
          Settings
        </h1>
        <p className="text-sm" style={{ color: "#8FA3B1" }}>
          Manage your profile, notification channels, and account security.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium mb-6"
          style={{ background: "rgba(79,174,132,0.08)", color: "#2D8A63", border: "1px solid rgba(79,174,132,0.2)" }}>
          {success}
        </div>
      )}

      <div className="flex flex-col gap-5">
        <ProfileSection   user={user} onSave={async (p) => { clearMessages(); await updateProfile(p); }} />
        <TelegramSection  user={user} onConnect={async (id) => { clearMessages(); await connectTelegram(id); }} onDisconnect={async () => { clearMessages(); await disconnectTelegram(); }} />
        {/* Password section only shown for local (email/password) accounts */}
        {user?.authProvider !== "google" && (
          <PasswordSection onSave={async (p) => { clearMessages(); await changePassword(p); }} />
        )}
        {user?.authProvider === "google" && (
          <SectionCard eyebrow="03 — Security" title="Password" sub="Your account uses Google Sign-In — no password is required.">
            <div className="flex items-center gap-3 rounded-lg px-4 py-3"
              style={{ background: "rgba(234,67,53,0.04)", border: "1px solid rgba(234,67,53,0.12)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.1 12 2.1 6.9 2.1 2.7 6.3 2.7 12s4.2 9.9 9.3 9.9c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.1-1.6H12z"/>
              </svg>
              <span className="text-sm" style={{ color: "#5C7589" }}>
                Signed in with Google. Manage your password via your Google account.
              </span>
            </div>
          </SectionCard>
        )}
        <DangerSection    user={user} onDelete={deleteAccount} onError={(msg) => { clearMessages(); }} />
      </div>
    </div>
  );
}

// ── Section card wrapper ───────────────────────────────────────────────────
function SectionCard({ eyebrow, title, sub, children }) {
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid #EAE6E0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-6 py-5" style={{ borderBottom: "1px solid #EAE6E0" }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8FA3B1", margin: "0 0 4px 0" }}>{eyebrow}</p>
        <h2 className="text-base font-semibold" style={{ color: "#0E1F33", margin: 0 }}>{title}</h2>
        {sub && <p className="text-sm mt-1" style={{ color: "#8FA3B1", margin: 0 }}>{sub}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── 01 Profile ─────────────────────────────────────────────────────────────
function ProfileSection({ user, onSave }) {
  const [form, setForm]   = useState({ firstName: "", lastName: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" }); }, [user]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const handleSave = async (e) => { e.preventDefault(); setSaving(true); try { await onSave(form); } finally { setSaving(false); } };

  return (
    <SectionCard eyebrow="01 — Profile" title="Personal information" sub="Your name is shown in your session and alert messages.">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" id="s-fname"><Input id="s-fname" value={form.firstName} onChange={set("firstName")} required /></Field>
          <Field label="Last name"  id="s-lname"><Input id="s-lname" value={form.lastName}  onChange={set("lastName")} /></Field>
        </div>
        <Field label="Email address" id="s-email">
          <Input id="s-email" type="email" value={user?.email ?? ""} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
        </Field>
        <p className="text-xs" style={{ color: "#8FA3B1" }}>Email is set at registration and cannot be changed.</p>
        <div className="flex justify-end">
          <PrimaryBtn type="submit" loading={saving} className="w-auto px-6">Save changes</PrimaryBtn>
        </div>
      </form>
    </SectionCard>
  );
}

// ── 02 Telegram ────────────────────────────────────────────────────────────
function TelegramSection({ user, onConnect, onDisconnect }) {
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
    if (!window.confirm("Disconnect Telegram? You won't receive alerts until you reconnect.")) return;
    setSaving(true);
    try { await onDisconnect(); } finally { setSaving(false); }
  };

  return (
    <SectionCard eyebrow="02 — Notifications" title="Telegram" sub="Connect your Telegram account to receive deal alerts.">
      <div className="flex flex-col gap-4">
        {/* Status badge */}
        <div className="flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ background: isConnected ? "rgba(79,174,132,0.06)" : "#F7F5F1", border: `1px solid ${isConnected ? "rgba(79,174,132,0.2)" : "#EAE6E0"}` }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: isConnected ? "rgba(79,174,132,0.15)" : "#EAE6E0" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isConnected ? "#4FAE84" : "#8FA3B1"} strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: isConnected ? "#2D8A63" : "#5C7589" }}>
              {isConnected ? "Telegram connected" : "Not connected"}
            </div>
            <div className="text-xs" style={{ color: "#8FA3B1" }}>
              {isConnected ? `Chat ID: ${user.telegramChatId}` : "Deal alerts will be sent to your Telegram."}
            </div>
          </div>
          <span className="w-2 h-2 rounded-full ml-auto" style={{ background: isConnected ? "#4FAE84" : "#E5E0D8" }} />
        </div>

        {!isConnected && (
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#F7F5F1", border: "1px solid #EAE6E0" }}>
            <p className="text-xs font-semibold" style={{ color: "#0E1F33" }}>How to connect</p>
            {[
              ["1", `Search Telegram for your bot and send /start`],
              ["2", "Search @userinfobot → send /start → it replies with your Chat ID"],
              ["3", "Paste the numeric ID below — we'll send a verification message"],
            ].map(([n, text]) => (
              <div key={n} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: "#F2A93B", color: "#23150A", fontFamily: "'Space Mono', monospace" }}>{n}</span>
                <span className="text-xs leading-relaxed" style={{ color: "#5C7589" }}>{text}</span>
              </div>
            ))}
          </div>
        )}

        {isConnected ? (
          <button onClick={handleDisconnect} disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "rgba(226,96,79,0.06)", border: "1.5px solid rgba(226,96,79,0.2)", color: "#C04030", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Disconnecting…" : "Disconnect Telegram"}
          </button>
        ) : (
          <form onSubmit={handleConnect} className="flex gap-3">
            <div className="flex-1">
              <Input placeholder="e.g. 123456789" value={chatId} onChange={(e) => setChatId(e.target.value)} required />
            </div>
            <PrimaryBtn type="submit" loading={saving} className="w-auto px-5 flex-shrink-0">Connect</PrimaryBtn>
          </form>
        )}
      </div>
    </SectionCard>
  );
}

// ── 03 Password ────────────────────────────────────────────────────────────
function PasswordSection({ onSave }) {
  const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [form, setForm]     = useState(EMPTY);
  const [localErr, setLocalErr] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setLocalErr("");
    if (form.newPassword.length < 8) { setLocalErr("New password must be at least 8 characters."); return; }
    if (form.newPassword !== form.confirmPassword) { setLocalErr("Passwords do not match."); return; }
    setSaving(true);
    try { await onSave({ currentPassword: form.currentPassword, newPassword: form.newPassword }); setForm(EMPTY); }
    catch { } finally { setSaving(false); }
  };

  return (
    <SectionCard eyebrow="03 — Security" title="Change password" sub="Use a strong password with uppercase letters and numbers.">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Field label="Current password" id="s-cpw">
          <Input id="s-cpw" type="password" placeholder="••••••••" value={form.currentPassword} onChange={set("currentPassword")} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="New password" id="s-npw">
            <Input id="s-npw" type="password" placeholder="Min. 8 chars" value={form.newPassword} onChange={set("newPassword")} required />
          </Field>
          <Field label="Confirm new password" id="s-cpw2">
            <Input id="s-cpw2" type="password" placeholder="Repeat" value={form.confirmPassword} onChange={set("confirmPassword")} required />
          </Field>
        </div>
        {localErr && <ErrorBanner message={localErr} />}
        <div className="flex justify-end">
          <PrimaryBtn type="submit" loading={saving} className="w-auto px-6">Update password</PrimaryBtn>
        </div>
      </form>
    </SectionCard>
  );
}

// ── 04 Danger zone ─────────────────────────────────────────────────────────
function DangerSection({ user, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <SectionCard eyebrow="04 — Danger zone" title="Delete account"
        sub="Permanently removes your account, all monitored routes, price history, and alert logs. This cannot be undone.">
        <div className="flex flex-col gap-4">
          {/* What gets deleted list */}
          <div className="rounded-lg px-4 py-3" style={{ background: "#FFF8F7", border: "1px solid rgba(226,96,79,0.15)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#C04030" }}>This will permanently delete:</p>
            <ul className="flex flex-col gap-1">
              {[
                "Your account and login credentials",
                "All monitored flight routes",
                "All price history and observations",
                "All deal alert logs",
                "Your Telegram connection",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "#5C7589" }}>
                  <span style={{ color: "#E2604F", fontSize: 10 }}>✕</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "rgba(226,96,79,0.06)", border: "1.5px solid rgba(226,96,79,0.2)", color: "#C04030", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(226,96,79,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(226,96,79,0.06)")}
          >
            Delete my account
          </button>
        </div>
      </SectionCard>

      {/* Confirmation modal */}
      <DeleteConfirmModal
        open={modalOpen}
        user={user}
        onClose={() => setModalOpen(false)}
        onConfirm={onDelete}
      />
    </>
  );
}

// ── Delete confirmation modal ──────────────────────────────────────────────
function DeleteConfirmModal({ open, user, onClose, onConfirm }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");   // type "DELETE" to unlock
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (!open) { setPassword(""); setConfirm(""); setError(""); setLoading(false); }
  }, [open]);

  const isUnlocked = confirm === "DELETE";
  const isGoogle   = user?.authProvider === "google";

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");
    if (!isUnlocked) { setError('Please type DELETE to confirm.'); return; }
    if (!isGoogle && !password) { setError("Password is required."); return; }
    setLoading(true);
    try {
      await onConfirm(isGoogle ? "" : password);
      // onConfirm calls logout → redirect happens automatically
    } catch (err) {
      setError(err.response?.data?.message || "Deletion failed. Please try again.");
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(14,31,51,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-2xl"
        style={{
          maxWidth: 440,
          background: "#FFFFFF",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          fontFamily: "'Work Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid #EAE6E0" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(226,96,79,0.10)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C04030" strokeWidth="2.2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, color: "#0E1F33", margin: 0 }}>
              Delete account
            </h3>
          </div>
          <p className="text-sm" style={{ color: "#8FA3B1" }}>
            This is permanent. All your data will be wiped immediately.
          </p>
        </div>

        <form onSubmit={handleConfirm} className="px-7 py-5 flex flex-col gap-4">
          {/* Password confirmation (local accounts only) */}
          {!isGoogle && (
            <Field label="Confirm your password" id="del-pw">
              <Input
                id="del-pw"
                type="password"
                placeholder="Enter your current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
          )}

          {/* Type DELETE */}
          <Field label='Type "DELETE" to confirm' id="del-confirm">
            <Input
              id="del-confirm"
              type="text"
              placeholder="DELETE"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              style={{
                borderColor: confirm && !isUnlocked ? "#E2604F" : undefined,
              }}
            />
          </Field>

          {error && <ErrorBanner message={error} />}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "#F7F5F1", border: "1.5px solid #EAE6E0", color: "#5C7589", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isUnlocked || loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: isUnlocked ? "#E2604F" : "#F0EDE7",
                color: isUnlocked ? "#FFFFFF" : "#BEB9B2",
                border: "none",
                cursor: isUnlocked && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}