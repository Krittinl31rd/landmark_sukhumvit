import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ toggleDrawer, menuItems }) => {
  return (
    <div className="drawer-side">
      <label
        htmlFor="main-drawer"
        className="drawer-overlay"
        onClick={toggleDrawer}
      ></label>
      <aside className="w-64 min-h-full bg-base-100 border-r border-base-300">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-primary">Navigation</h2>
        </div>
        <ul className="menu p-4 space-y-1 w-full">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              {...(index === 0 ? { end: true } : {})}
              className={({ isActive }) =>
                isActive
                  ? "flex items-center gap-3 p-3 rounded-lg transition-colors bg-primary text-primary-content font-semibold"
                  : "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-base-200"
              }
              onClick={() => {
                if (window.innerWidth < 1024) toggleDrawer();
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </ul>
      </aside>
    </div>
  );
};

export default Sidebar;
