import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

export default function DashboardLayout() {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "#F5F3EF", fontFamily: "'Work Sans', sans-serif" }}
    >
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
