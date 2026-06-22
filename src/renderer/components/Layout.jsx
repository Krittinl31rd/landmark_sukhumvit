import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Sun,
  Map,
  NotepadText,
  icons,
  Building,
  DoorClosed,
  Warehouse,
  Settings,
  SwitchCamera,
  SlidersVertical,
  Router,
  Calendar,
} from "lucide-react";
import Navbar from "./shared/Navbar";
import Sidebar from "./shared/Sidebar";
import { useAuth } from "../../contexts/UserContext";

// 1 admin, 2 user
const sidebarItem = [
  {
    path: "/rooms",
    label: "Rooms Schedule",
    icon: <Calendar />,
    roles: [1, 2],
  },
  {
    path: "/rooms_control",
    label: "Rooms Control",
    icon: <SlidersVertical />,
    roles: [1, 2],
  },
  {
    path: "/setting_room",
    label: "Rooms Setting",
    icon: <Settings />,
    roles: [1],
  },
  { path: "/setting", label: "Gateway", icon: <Router />, roles: [1] },
];
const Layout = () => {
  const { auth } = useAuth();
  const filteredMenu = sidebarItem.filter((item) =>
    item.roles.includes(auth?.user?.role_id)
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleDrawer = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="main-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        readOnly
      />

      {/* Main content */}
      <div className="drawer-content flex flex-col w-full">
        <Navbar toggleDrawer={toggleDrawer} />

        <main className="pt-[80px] pl-4 pb-4 pr-4 bg-base-200 h-[calc(100vh-8px)] flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <Sidebar toggleDrawer={toggleDrawer} menuItems={filteredMenu} />
    </div>
  );
};

export default Layout;
