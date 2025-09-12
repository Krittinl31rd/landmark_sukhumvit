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

const sidebarItem = [
  { path: "/rooms", label: "Rooms Schedule", icon: <Calendar /> },
  { path: "/rooms_control", label: "Rooms Control", icon: <SlidersVertical /> },
  { path: "/setting_room", label: "Rooms Setting", icon: <Settings /> },
  { path: "/setting", label: "Gateway", icon: <Router /> },
];

const Layout = () => {
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

        <main className="pt-[80px] pl-4 pb-4 pr-4 bg-base-200 h-[calc(100vh-8px)] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <Sidebar toggleDrawer={toggleDrawer} menuItems={sidebarItem} />
    </div>
  );
};

export default Layout;
