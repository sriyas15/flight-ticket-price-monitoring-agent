import { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser.js";
import { Field, Input, PrimaryBtn, ErrorBanner } from "../components/ui/index.jsx";

export default function SettingsPage() {
  const { user, error, success, clearMessages, updateProfile, connectTelegram, disconnectTelegram, changePassword } = useUser();

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
        <ProfileSection user={user} onSave={async (p) => { clearMessages(); await updateProfile(p); }} />
        <TelegramSection user={user} onConnect={async (id) => { clearMessages(); await connectTelegram(id); }} onDisconnect={async () => { clearMessages(); await disconnectTelegram(); }} />
        <PasswordSection onSave={async (p) => { clearMessages(); await changePassword(p); }} />
        <DangerSection />
      </div>
    </div>
  );
}

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

function ProfileSection({ user, onSave }) {
  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" }); }, [user]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const handleSave = async (e) => { e.preventDefault(); setSaving(true); try { await onSave(form); } finally { setSaving(false); } };

  return (
    <SectionCard eyebrow="01 — Profile" title="Personal information" sub="Your name is shown in your session and alert messages.">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" id="s-fname"><Input id="s-fname" value={form.firstName} onChange={set("firstName")} required /></Field>
          <Field label="Last name" id="s-lname"><Input id="s-lname" value={form.lastName} onChange={set("lastName")} /></Field>
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

function TelegramSection({ user, onConnect, onDisconnect }) {
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const isConnected = !!user?.telegramChatId;

  const handleConnect = async (e) => { e.preventDefault(); if (!chatId.trim()) return; setSaving(true); try { await onConnect(chatId.trim()); setChatId(""); } finally { setSaving(false); } };
  const handleDisconnect = async () => { if (!confirm("Disconnect Telegram?")) return; setSaving(true); try { await onDisconnect(); } finally { setSaving(false); } };

  return (
    <SectionCard eyebrow="02 — Notifications" title="Telegram" sub="Connect your Telegram account to receive deal alerts.">
      <div className="flex flex-col gap-4">
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
            <p className="text-xs font-semibold" style={{ color: "#0E1F33" }}>How to get your Chat ID</p>
            {[["1","Open Telegram and search for @userinfobot"],["2","Start the bot and send /start — it replies with your Chat ID"],["3","Copy the numeric ID and paste it below"]].map(([n,text]) => (
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

function PasswordSection({ onSave }) {
  const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [form, setForm] = useState(EMPTY);
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
        <Field label="Current password" id="s-cpw"><Input id="s-cpw" type="password" placeholder="••••••••" value={form.currentPassword} onChange={set("currentPassword")} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="New password" id="s-npw"><Input id="s-npw" type="password" placeholder="Min. 8 chars" value={form.newPassword} onChange={set("newPassword")} required /></Field>
          <Field label="Confirm new password" id="s-cpw2"><Input id="s-cpw2" type="password" placeholder="Repeat" value={form.confirmPassword} onChange={set("confirmPassword")} required /></Field>
        </div>
        {localErr && <ErrorBanner message={localErr} />}
        <div className="flex justify-end">
          <PrimaryBtn type="submit" loading={saving} className="w-auto px-6">Update password</PrimaryBtn>
        </div>
      </form>
    </SectionCard>
  );
}

function DangerSection() {
  return (
    <SectionCard eyebrow="04 — Danger zone" title="Delete account" sub="Permanently remove your account, routes, and all data. This cannot be undone.">
      <button onClick={() => alert("Account deletion — coming soon.")}
        className="py-2.5 px-5 rounded-lg text-sm font-semibold"
        style={{ background: "rgba(226,96,79,0.06)", border: "1.5px solid rgba(226,96,79,0.2)", color: "#C04030", cursor: "pointer" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(226,96,79,0.12)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(226,96,79,0.06)")}>
        Delete my account
      </button>
    </SectionCard>
  );
}
