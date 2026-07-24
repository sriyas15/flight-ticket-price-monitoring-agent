import { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser.js";
import { Field, Input, PrimaryBtn, ErrorBanner } from "../components/ui/index.jsx";

export default function SettingsPage() {
  const {
    user, error, success, clearMessages,
    updateProfile,
    changePassword, deleteAccount,
    updateNotifyHour,
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
        <TelegramSection  user={user} onSaveHour={async (h) => { clearMessages(); await updateNotifyHour(h); }} />
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

/** IST is UTC+5:30. Convert an IST hour (0-23) to the UTC hour stored on the server. */
const istToUtcHour = (istHour) => Math.floor(((istHour * 60 - 330) + 1440) % 1440 / 60);

/** Convert a stored UTC hour back to the nearest IST hour for display. */
const utcToIstHour = (utcHour) => Math.round(((utcHour * 60 + 330)) % 1440 / 60) % 24;

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => {
  const label = h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
  return { value: h, label };
});

function TelegramSection({ user, onSaveHour }) {
  const isConnected = !!user?.telegramChatId;

  // savedIstHour is the source of truth for what's been persisted.
  // We own it as state so we can update it after a successful save
  // without waiting for the AuthContext user to refresh.
  const [savedIstHour, setSavedIstHour] = useState(() => utcToIstHour(user?.notifyHour ?? 6));
  const [istHour,      setIstHour]      = useState(() => utcToIstHour(user?.notifyHour ?? 6));
  const [saving,       setSaving]       = useState(false);
  const [savedMsg,     setSavedMsg]     = useState(false); // local success flash

  // Sync from context on first load (covers page refresh / initial mount)
  useEffect(() => {
    const h = utcToIstHour(user?.notifyHour ?? 6);
    setSavedIstHour(h);
    setIstHour(h);
  }, [user?.notifyHour]);

  const previewUtc   = istToUtcHour(istHour);
  const previewLabel = HOUR_OPTIONS[istHour]?.label ?? "";
  const utcLabel     = `${String(previewUtc).padStart(2, "0")}:00 UTC`;
  const isModified   = istHour !== savedIstHour;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isModified) return;
    setSaving(true);
    try {
      await onSaveHour(istToUtcHour(istHour));
      // Update our local baseline — button disables immediately
      setSavedIstHour(istHour);
      // Show inline success message, auto-dismiss after 3 s
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard eyebrow="02 — Notifications" title="Telegram" sub="Manage your Telegram connection and alert schedule.">
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
              {isConnected ? `Chat ID: ${user.telegramChatId}` : "Deal alerts will be sent to your Telegram once connected."}
            </div>
          </div>
          <span className="w-2 h-2 rounded-full ml-auto" style={{ background: isConnected ? "#4FAE84" : "#E5E0D8" }} />
        </div>

        {/* Alert time — only shown when connected */}
        {isConnected && (
          <>
            <div style={{ borderTop: "1px solid #EAE6E0", marginTop: 2 }} />

            {/* Label */}
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0E1F33", marginBottom: 2 }}>Daily alert time</p>
              <p className="text-xs" style={{ color: "#8FA3B1" }}>Choose when you want to receive your daily Telegram price report. Times are in India Standard Time (IST).</p>
            </div>

            {/* Picker row */}
            <form onSubmit={handleSave}>
              <div className="flex items-center gap-3">
                {/* Hour select */}
                <div className="relative" style={{ flex: "0 0 160px" }}>
                  <select
                    id="notify-hour-select"
                    value={istHour}
                    onChange={(e) => setIstHour(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px 36px 10px 14px",
                      border: "1.5px solid #D9D3CC",
                      borderRadius: 10,
                      fontSize: 14,
                      fontFamily: "'Work Sans', sans-serif",
                      fontWeight: 500,
                      color: "#0E1F33",
                      background: "#FAFAF9",
                      appearance: "none",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {HOUR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {/* Chevron icon */}
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#8FA3B1" strokeWidth="2.5"
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* IST badge */}
                <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: "rgba(30,120,255,0.07)", color: "#1E78FF", flexShrink: 0 }}>
                  IST
                </span>

                {/* UTC preview */}
                <span className="text-xs" style={{ color: "#8FA3B1", flexShrink: 0 }}>
                  = {utcLabel}
                </span>

                {/* Save button */}
                <button
                  id="save-notify-hour-btn"
                  type="submit"
                  disabled={saving || !isModified}
                  style={{
                    marginLeft: "auto",
                    padding: "9px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: saving || !isModified ? "#D9D3CC" : "#0E1F33",
                    color: saving || !isModified ? "#8FA3B1" : "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'Work Sans', sans-serif",
                    cursor: saving || !isModified ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                    flexShrink: 0,
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>

              {/* Helper / inline success */}
              {savedMsg ? (
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#2D8A63" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Alert time saved — you'll receive reports at <strong style={{ marginLeft: 2 }}>{HOUR_OPTIONS[savedIstHour]?.label} IST</strong>.
                </p>
              ) : (
                <p className="text-xs mt-2" style={{ color: "#8FA3B1" }}>
                  You'll receive your daily price report at <strong style={{ color: "#5C7589" }}>{previewLabel} IST</strong> ({utcLabel}).
                </p>
              )}
            </form>
          </>
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