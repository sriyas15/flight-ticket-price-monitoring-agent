export default function SettingsPage() {
  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: "#0E1F33", margin: "0 0 8px 0" }}>
        Settings
      </h1>
      <p className="text-sm mb-8" style={{ color: "#8FA3B1" }}>
        Manage your notification channels and account preferences.
      </p>
      <div className="rounded-xl px-6 py-8 flex items-center justify-center"
        style={{ background: "#FFFFFF", border: "1px solid #EAE6E0", color: "#8FA3B1", fontSize: 14 }}>
        Settings coming soon — Telegram connect, account details, notification preferences.
      </div>
    </div>
  );
}
